<#
.SYNOPSIS
  Uploads the backend's uploaded files (public/) from the Windows server to the VPS using rclone over SFTP.

.DESCRIPTION
  Safe to re-run at any time: files that already exist on the VPS with the same size and
  modification time are skipped, so an interrupted upload simply continues where it stopped.
  Run it once for the bulk copy, then again at cutover to send only the new files.

  Modes:
    Plan    - dry run, shows what would be uploaded (nothing is sent)
    Upload  - uploads, retrying until complete, then runs a quick verification (default)
    Verify  - compares local and VPS only (add -Hash for a full MD5 comparison)

.EXAMPLE
  .\upload-files-to-vps.ps1 -Source "D:\ecgbc\apps\backend\public" -VpsHost 203.0.113.10 -VpsUser root -Mode Plan

.EXAMPLE
  .\upload-files-to-vps.ps1 -Source "D:\ecgbc\apps\backend\public" -VpsHost 203.0.113.10 -VpsUser root -BwLimit "08:00,2M 18:00,off"

.EXAMPLE
  .\upload-files-to-vps.ps1 -Source "D:\ecgbc\apps\backend\public" -VpsHost 203.0.113.10 -VpsUser root -Mode Verify -Hash

.EXAMPLE
  # Cutover after the bulk copy was sent as a zip: uploads only files missing on the VPS
  .\upload-files-to-vps.ps1 -Source "D:\ecgbc\apps\backend\public" -VpsHost 203.0.113.10 -VpsUser root -SizeOnly
#>
[CmdletBinding()]
param(
    # Local public folder on the Windows server (contains files\ and images\)
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$VpsHost,

    [Parameter(Mandatory = $true)]
    [string]$VpsUser,

    # Path on the VPS, relative to the VPS user's home folder (or absolute, starting with /)
    [string]$RemotePath = "ecgbc-registration/apps/backend/public",

    [int]$Port = 22,

    [string]$KeyFile = (Join-Path $env:USERPROFILE ".ssh\id_ed25519"),

    [ValidateSet("Plan", "Upload", "Verify")]
    [string]$Mode = "Upload",

    # Parallel file transfers; more connections means more dropped connections on a weak link
    [int]$Transfers = 4,

    # Optional bandwidth schedule, e.g. "08:00,2M 18:00,off" (2 MB/s in work hours, unlimited at night)
    [string]$BwLimit = "",

    # How many times to restart rclone after a failure (e.g. long network outage)
    [int]$MaxAttempts = 50,

    # Verify with MD5 hashes instead of names and sizes (slower, computed on the VPS)
    [switch]$Hash,

    # Upload: treat files with the same name and size as already uploaded, ignoring timestamps.
    # Use after the bulk copy was done another way (e.g. a zip extracted on the VPS).
    [switch]$SizeOnly
)

# Not "Stop": Windows PowerShell 5.1 turns rclone's informational stderr notices into errors
# and would abort. Failures are detected through rclone's exit codes and explicit throws instead.
$ErrorActionPreference = "Continue"

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

# Runs rclone and returns only its exit code. Output goes straight to the console;
# without Out-Host PowerShell would merge it into the return value.
function Invoke-Rclone([string[]]$Arguments) {
    & rclone @Arguments | Out-Host
    return $LASTEXITCODE
}

# Keeps Windows from sleeping while the upload runs (reset automatically when the script exits)
$sleepBlocker = @"
using System;
using System.Runtime.InteropServices;
public static class SleepBlocker {
    [DllImport("kernel32.dll")]
    public static extern uint SetThreadExecutionState(uint esFlags);
}
"@
Add-Type -TypeDefinition $sleepBlocker -ErrorAction SilentlyContinue
$ES_CONTINUOUS = [uint32]"0x80000000"
$ES_SYSTEM_REQUIRED = [uint32]"0x00000001"

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
Write-Step "Checking prerequisites"

if (-not (Get-Command rclone -ErrorAction SilentlyContinue)) {
    Write-Host "rclone is not installed. Installing with winget..." -ForegroundColor Yellow
    winget install --id Rclone.Rclone -e --accept-source-agreements --accept-package-agreements
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    if (-not (Get-Command rclone -ErrorAction SilentlyContinue)) {
        throw "rclone was installed but is not on PATH yet. Close this window, open a new PowerShell and run the script again."
    }
}
Write-Host ("rclone found: " + (& rclone version | Select-Object -First 1))

if (-not (Test-Path -LiteralPath $Source -PathType Container)) {
    throw "Source folder not found: $Source"
}
$Source = (Resolve-Path -LiteralPath $Source).Path
foreach ($expected in @("files", "images")) {
    if (-not (Test-Path -LiteralPath (Join-Path $Source $expected))) {
        Write-Host "Warning: '$expected' folder not found under $Source. Is this the backend's public folder?" -ForegroundColor Yellow
    }
}

if (-not (Test-Path -LiteralPath $KeyFile)) {
    throw "SSH key not found: $KeyFile. Create one with 'ssh-keygen -t ed25519' and add the .pub file to ~/.ssh/authorized_keys on the VPS."
}

# rclone reads the SFTP connection from these variables, so no saved rclone config is needed
$env:RCLONE_SFTP_HOST = $VpsHost
$env:RCLONE_SFTP_USER = $VpsUser
$env:RCLONE_SFTP_PORT = "$Port"
$env:RCLONE_SFTP_KEY_FILE = $KeyFile
$env:RCLONE_SFTP_SHELL_TYPE = "unix"
$Destination = ":sftp:$RemotePath"

# Verify the server's identity against the host key ssh saved on the first login
$knownHosts = Join-Path $env:USERPROFILE ".ssh\known_hosts"
if (Test-Path -LiteralPath $knownHosts) {
    $env:RCLONE_SFTP_KNOWN_HOSTS_FILE = $knownHosts
} else {
    Write-Host "Warning: $knownHosts not found, so the server's identity is not checked. Run 'ssh $VpsUser@$VpsHost' once to save it." -ForegroundColor Yellow
}

$logDir = Join-Path $PSScriptRoot "upload-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Empty config file: everything comes from the variables above (avoids the "config not found" notice)
$env:RCLONE_CONFIG = Join-Path $logDir "rclone.conf"
if (-not (Test-Path -LiteralPath $env:RCLONE_CONFIG)) { New-Item -ItemType File -Path $env:RCLONE_CONFIG | Out-Null }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logDir "upload-$Mode-$stamp.log"

$logArgs = @("--log-file", $logFile, "--log-level", "INFO")
$commonArgs = @(
    "--exclude", "Thumbs.db",
    "--exclude", "desktop.ini",
    "--exclude", "*.tmp"
) + $logArgs

Write-Step "Testing connection to $VpsUser@${VpsHost}:$Port"
& rclone lsd ":sftp:" --contimeout 30s | Out-Null
$code = $LASTEXITCODE
if ($code -ne 0) {
    throw "Cannot connect to the VPS over SFTP (rclone exit code $code). Check host, user, port and that the key is in authorized_keys. Test with: ssh -i `"$KeyFile`" -p $Port $VpsUser@$VpsHost"
}
Write-Host "Connection OK." -ForegroundColor Green

Write-Step "Local size ($Source)"
& rclone size $Source --exclude Thumbs.db --exclude desktop.ini --exclude "*.tmp"

Write-Step "Free space on the VPS"
& rclone about ":sftp:" -q | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not read free space; check it on the VPS with 'df -h ~'." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Source      : $Source"
Write-Host "Destination : $VpsUser@${VpsHost}:$RemotePath"
Write-Host "Mode        : $Mode"
Write-Host "Log file    : $logFile"

# ---------------------------------------------------------------------------
# Filenames too long for Linux (255 bytes max per name)
#
# The old system saved Amharic upload names garbled (each letter as 3 Latin-1 characters,
# 6 bytes in UTF-8), so a few names exceed the limit and the VPS rejects them with
# "Bad message". Those files are sent under a short name instead:
#     file-<MD5 of the first 191 characters of the name><extension>
# The database column holds at most 191 characters, so the old system's DB value is exactly
# those characters; db-migration/import-old-system.sql renames the rows the same way.
# ---------------------------------------------------------------------------
function Get-ShortName([string]$Name) {
    $key = if ($Name.Length -gt 191) { $Name.Substring(0, 191) } else { $Name }
    $md5 = [Security.Cryptography.MD5]::Create()
    $hash = -join ($md5.ComputeHash([Text.Encoding]::UTF8.GetBytes($key)) | ForEach-Object { $_.ToString("x2") })
    $dot = $Name.LastIndexOf(".")
    $ext = if ($dot -gt 0) { $Name.Substring($dot) } else { "" }
    return "file-$hash$ext"
}

function Invoke-RcloneUtf8([string[]]$Arguments) {
    $previous = [Console]::OutputEncoding
    [Console]::OutputEncoding = [Text.Encoding]::UTF8
    try { return (& rclone @Arguments) } finally { [Console]::OutputEncoding = $previous }
}

Write-Step "Checking for filenames too long for Linux"
$longFiles = @(Invoke-RcloneUtf8 @("lsf", "-R", "--files-only", $Source) |
    Where-Object { [Text.Encoding]::UTF8.GetByteCount(($_ -split "/")[-1]) -gt 255 } |
    ForEach-Object {
        $slash = $_.LastIndexOf("/")
        $dir = if ($slash -ge 0) { $_.Substring(0, $slash) } else { "" }
        $name = $_.Substring($slash + 1)
        $short = Get-ShortName $name
        [pscustomobject]@{
            Rel      = $_
            Local    = Join-Path $Source ($_ -replace "/", "\")
            Remote   = "$Destination/" + $(if ($dir) { "$dir/" } else { "" }) + $short
            Short    = $short
        }
    })

if ($longFiles.Count -gt 0) {
    # Keep them out of the main copy (it would retry them forever) and send them separately
    $excludeFile = Join-Path $logDir "long-names-exclude.txt"
    $patterns = $longFiles | ForEach-Object { "/" + ($_.Rel -replace '([\\*?\[\]{}])', '\$1') }
    [IO.File]::WriteAllLines($excludeFile, [string[]]$patterns, (New-Object Text.UTF8Encoding $false))
    $commonArgs += @("--exclude-from", $excludeFile)

    $manifest = Join-Path $logDir "long-names-manifest.tsv"
    $rows = @("original_path`tuploaded_as") + ($longFiles | ForEach-Object { "$($_.Rel)`t$($_.Short)" })
    [IO.File]::WriteAllLines($manifest, [string[]]$rows, (New-Object Text.UTF8Encoding $false))

    Write-Host "$($longFiles.Count) file(s) have names too long for Linux; they are uploaded under short names." -ForegroundColor Yellow
    Write-Host "List (original -> short name): $manifest"
} else {
    Write-Host "None."
}

function Send-LongNameFiles {
    if ($longFiles.Count -eq 0) { return 0 }
    Write-Step "Uploading $($longFiles.Count) file(s) with long names under short names"
    $failed = 0
    foreach ($f in $longFiles) {
        $code = Invoke-Rclone (@("copyto", $f.Local, $f.Remote, "--retries", "5", "--low-level-retries", "30", "--contimeout", "60s") + $logArgs)
        if ($code -ne 0) { $failed++; Write-Host "  Failed: $($f.Rel)" -ForegroundColor Red }
    }
    if ($failed -eq 0) { Write-Host "All long-name files uploaded." -ForegroundColor Green }
    return $failed
}

function Test-LongNameFiles {
    if ($longFiles.Count -eq 0) { return 0 }
    $bad = 0
    foreach ($f in $longFiles) {
        $localJson = (Invoke-RcloneUtf8 @("lsjson", "--stat", $f.Local)) -join "`n"
        $remoteJson = (Invoke-RcloneUtf8 @("lsjson", "--stat", $f.Remote) 2>$null) -join "`n"
        $localInfo = if ($localJson.Trim()) { $localJson | ConvertFrom-Json } else { $null }
        $remoteInfo = if ($remoteJson.Trim()) { $remoteJson | ConvertFrom-Json } else { $null }
        if (-not $remoteInfo -or -not $localInfo -or $remoteInfo.Size -ne $localInfo.Size) {
            $bad++
            Write-Host "  Missing or different on VPS: $($f.Short) (from $($f.Rel))" -ForegroundColor Red
        }
    }
    return $bad
}

# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------
function Invoke-Verify {
    Write-Step "Verifying VPS against local files"
    $checkArgs = @("check", $Source, $Destination, "--one-way", "--checkers", "16") + $commonArgs
    if ($Hash) {
        Write-Host "Comparing MD5 hashes (slow on 50 GB)..."
    } else {
        $checkArgs += "--size-only"
        Write-Host "Comparing names and sizes..."
    }
    $result = Invoke-Rclone $checkArgs
    $badLong = Test-LongNameFiles
    if ($result -eq 0 -and $badLong -eq 0) {
        Write-Host "Verification passed: every local file exists on the VPS with matching content." -ForegroundColor Green
    } else {
        if ($result -eq 0) { $result = 1 }
        Write-Host "Verification found differences. Re-run in Upload mode, then verify again. Details: $logFile" -ForegroundColor Red
    }
    Write-Step "VPS size ($RemotePath)"
    & rclone size $Destination | Out-Host
    return $result
}

switch ($Mode) {
    "Plan" {
        Write-Step "Dry run (nothing will be uploaded)"
        $code = Invoke-Rclone (@("copy", $Source, $Destination, "--dry-run") + $commonArgs)
        if ($code -ne 0) {
            Write-Host "Dry run failed (exit code $code). Details: $logFile" -ForegroundColor Red
            exit $code
        }
        $toSend = @(Select-String -LiteralPath $logFile -Pattern "Skipped copy as --dry-run")
        Write-Host "Files that Upload would send: $($toSend.Count)" -ForegroundColor Green
        Write-Host "First 15:"
        $toSend | Select-Object -First 15 | ForEach-Object {
            Write-Host ("  " + ($_.Line -replace '^.*NOTICE: (.*): Skipped copy as --dry-run.*$', '$1'))
        }
        Write-Host "Full list: $logFile"
        if ($longFiles.Count -gt 0) {
            Write-Host "Plus $($longFiles.Count) long-name file(s) sent under short names, e.g.:"
            $longFiles | Select-Object -First 3 | ForEach-Object { Write-Host "  $($_.Short)" }
        }
        exit 0
    }

    "Verify" {
        $result = Invoke-Verify
        exit $result
    }

    "Upload" {
        $null = Invoke-Rclone @("mkdir", $Destination)

        $copyArgs = @(
            "copy", $Source, $Destination,
            "--transfers", "$Transfers",
            "--checkers", "16",
            "--retries", "10",
            "--low-level-retries", "30",
            "--contimeout", "60s",
            "--timeout", "5m",
            "--progress",
            "--stats", "30s"
        ) + $commonArgs
        if ($BwLimit) { $copyArgs += @("--bwlimit", $BwLimit) }
        if ($SizeOnly) { $copyArgs += "--size-only" }

        [SleepBlocker]::SetThreadExecutionState($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED) | Out-Null
        try {
            $attempt = 1
            while ($true) {
                Write-Step "Uploading (attempt $attempt of $MaxAttempts) - started $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
                # Called directly (not through Invoke-Rclone) so the live progress display works
                & rclone @copyArgs
                $result = $LASTEXITCODE
                if ($result -eq 0) {
                    $result = Send-LongNameFiles
                }
                if ($result -eq 0) {
                    Write-Host "Upload complete at $(Get-Date -Format 'yyyy-MM-dd HH:mm')." -ForegroundColor Green
                    break
                }
                if ($attempt -ge $MaxAttempts) {
                    throw "Upload still failing after $MaxAttempts attempts (last exit code $result). See $logFile. Re-running the script continues from where it stopped."
                }
                Write-Host "rclone exited with code $result. Waiting 60 seconds, then continuing (already uploaded files are skipped)..." -ForegroundColor Yellow
                Start-Sleep -Seconds 60
                $attempt++
            }
        }
        finally {
            [SleepBlocker]::SetThreadExecutionState($ES_CONTINUOUS) | Out-Null
        }

        $result = Invoke-Verify
        exit $result
    }
}
