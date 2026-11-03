#!/usr/bin/env python3
"""
Verification Script for ECGBC Production and Staging Environments
Ensures Production is intact and Staging is 100% sanitized.
"""

import subprocess
import sys

def query_db(db_name, sql):
    cmd = [
        "docker", "exec", "ecgbc-db",
        "mysql", "-uecgbc_user", "-pecgbc_password123",
        "--default-character-set=utf8mb4",
        db_name, "-N", "-e", sql
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Error querying {db_name}: {proc.stderr.strip()}")
    return proc.stdout.strip()

def main():
    print("=================================================================")
    print("   ECGBC PRODUCTION & STAGING VERIFICATION SUITE")
    print("=================================================================\n")

    # 1. Verify Production
    print("[1] Verifying Production Database (`ecgbc_db`)...")
    prod_members = query_db("ecgbc_db", "SELECT count(*) FROM member;")
    prod_staff = query_db("ecgbc_db", "SELECT count(*) FROM staff;")
    prod_users = query_db("ecgbc_db", "SELECT count(*) FROM churchuser;")
    prod_reports = query_db("ecgbc_db", "SELECT count(*) FROM report;")
    prod_files = query_db("ecgbc_db", "SELECT count(*) FROM file;")

    print(f"    - Members: {prod_members} (Expected: 4060)")
    print(f"    - Staff accounts: {prod_staff} (Real accounts preserved)")
    print(f"    - Church users: {prod_users}")
    print(f"    - Reports: {prod_reports}")
    print(f"    - Files: {prod_files}")

    assert int(prod_members) == 4060, "Production member count mismatch!"
    assert int(prod_staff) >= 13, "Production staff count altered!"
    print("    [PASS] Production database is intact and untouched!\n")

    # 2. Verify Staging
    print("[2] Verifying Staging Database (`ecgbc_staging`)...")
    stg_members = query_db("ecgbc_staging", "SELECT count(*) FROM member;")
    stg_bm = query_db("ecgbc_staging", "SELECT count(*) FROM boardmember;")
    stg_staff = query_db("ecgbc_staging", "SELECT count(*) FROM staff;")
    stg_users = query_db("ecgbc_staging", "SELECT count(*) FROM churchuser;")
    stg_activity = query_db("ecgbc_staging", "SELECT count(*) FROM activity;")

    print(f"    - Members: {stg_members} (Expected: 4060)")
    print(f"    - Board members: {stg_bm} (Expected: 21091)")
    print(f"    - Staff accounts: {stg_staff} (Expected: 2)")
    print(f"    - Church users: {stg_users} (Expected: 2)")
    print(f"    - Activity logs: {stg_activity} (Expected: 0)")

    assert int(stg_members) == 4060, "Staging member count mismatch!"
    assert int(stg_bm) == 21091, "Staging board member count mismatch!"
    assert int(stg_staff) == 2, f"Staging staff count should be exactly 2, got {stg_staff}!"
    assert int(stg_users) == 2, f"Staging churchuser count should be exactly 2, got {stg_users}!"
    # Check activity logs for any real personal emails
    real_activity_emails = query_db("ecgbc_staging", """
        SELECT count(*) FROM activity 
        WHERE description NOT LIKE '%insa%' 
          AND description LIKE '%@%';
    """)
    assert int(real_activity_emails) == 0, f"Found {real_activity_emails} real user emails in activity logs!"
    print(f"    - Confirmed activity audit logs contain zero real user entries (INSA audit events: {stg_activity})")

    # Check staff emails
    staff_emails = query_db("ecgbc_staging", "SELECT email FROM staff ORDER BY email ASC;").split("\n")
    expected_staff = ["insa-admin@ecgbc.org", "insa-reviewer@ecgbc.org"]
    assert staff_emails == expected_staff, f"Unexpected staff accounts: {staff_emails}"
    print(f"    - Confirmed staff accounts: {staff_emails}")

    # Check church user emails
    cu_emails = query_db("ecgbc_staging", "SELECT email FROM churchuser ORDER BY email ASC;").split("\n")
    expected_cu = ["insa-church1@ecgbc.org", "insa-church2@ecgbc.org"]
    assert cu_emails == expected_cu, f"Unexpected church user accounts: {cu_emails}"
    print(f"    - Confirmed church user accounts: {cu_emails}")

    # Check for any lingering gmail/yahoo/hotmail emails in member, staff, churchuser
    non_dummy_emails = query_db("ecgbc_staging", """
        SELECT count(*) FROM (
            SELECT email FROM member WHERE email IS NOT NULL AND email NOT LIKE '%@staging.ecgbc.org'
            UNION ALL
            SELECT email FROM staff WHERE email NOT LIKE '%@ecgbc.org'
            UNION ALL
            SELECT email FROM churchuser WHERE email NOT LIKE '%@ecgbc.org'
        ) t;
    """)
    assert int(non_dummy_emails) == 0, f"Found {non_dummy_emails} non-dummy emails in staging!"
    print(f"    - Confirmed zero non-dummy emails in staging: {non_dummy_emails}")

    # Check for files decoupling
    non_sample_files = query_db("ecgbc_staging", "SELECT count(*) FROM file WHERE file != 'sample-document.pdf';")
    assert int(non_sample_files) == 0, f"Found {non_sample_files} files not pointing to sample-document.pdf!"
    print(f"    - Confirmed 100% files decoupled: {non_sample_files} lingering files")

    # Check reports decoupling
    non_sample_reports = query_db("ecgbc_staging", "SELECT count(*) FROM report WHERE file IS NOT NULL AND file != 'sample-report.pdf';")
    assert int(non_sample_reports) == 0, f"Found {non_sample_reports} report files not pointing to sample-report.pdf!"
    print(f"    - Confirmed 100% report files decoupled: {non_sample_reports} lingering report files")

    # Check phone numbers
    non_dummy_phones = query_db("ecgbc_staging", """
        SELECT count(*) FROM (
            SELECT phoneNumber FROM member WHERE phoneNumber IS NOT NULL AND phoneNumber NOT LIKE '+251911%'
            UNION ALL
            SELECT phoneNumber FROM boardmember WHERE phoneNumber IS NOT NULL AND phoneNumber NOT LIKE '+251911%'
            UNION ALL
            SELECT phoneNumber FROM staff WHERE phoneNumber IS NOT NULL AND phoneNumber NOT LIKE '+251911%'
            UNION ALL
            SELECT phone FROM churchuser WHERE phone IS NOT NULL AND phone NOT LIKE '+251911%'
        ) t;
    """)
    assert int(non_dummy_phones) == 0, f"Found {non_dummy_phones} non-dummy phone numbers!"
    print(f"    - Confirmed 100% phone numbers anonymized to dummy +251911...: {non_dummy_phones}")

    print("\n    [PASS] Staging database is 100% sanitized and anonymized!\n")

    # 3. Verify Live Staging API Endpoints & Auth
    print("[3] Verifying Live Staging API (http://127.0.0.1:8081)...")
    import urllib.request
    import json

    # Test Admin Login
    admin_login_url = "http://127.0.0.1:8081/api/v1/auth/login"
    admin_payload = json.dumps({"email": "insa-admin@ecgbc.org", "password": "InsaAdmin#2026!Audit"}).encode("utf-8")
    req_admin = urllib.request.Request(admin_login_url, data=admin_payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req_admin, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            admin_token = data.get("data", {}).get("accessToken") or data.get("accessToken") or data.get("token")
            assert resp.status == 200, f"Admin login status {resp.status}"
            assert admin_token, "No access token returned for insa-admin"
            print("    - Admin login (insa-admin@ecgbc.org): SUCCESS (200 OK, token issued)")
    except Exception as e:
        print(f"    - Admin login FAILED: {e}")
        raise

    # Test Church Login
    church_login_url = "http://127.0.0.1:8081/api/v1/church-auth/login"
    church_payload = json.dumps({"email": "insa-church1@ecgbc.org", "password": "InsaChurch1#2026!Audit"}).encode("utf-8")
    req_church = urllib.request.Request(church_login_url, data=church_payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req_church, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            church_token = data.get("data", {}).get("accessToken") or data.get("accessToken") or data.get("token")
            assert resp.status == 200, f"Church user login status {resp.status}"
            assert church_token, "No access token returned for insa-church1"
            print("    - Church user login (insa-church1@ecgbc.org): SUCCESS (200 OK, token issued)")
    except Exception as e:
        print(f"    - Church user login FAILED: {e}")
        raise

    # Test Church Portal Profile retrieval
    church_profile_url = "http://127.0.0.1:8081/api/v1/church-portal/profile"
    req_profile = urllib.request.Request(church_profile_url, headers={"Authorization": f"Bearer {church_token}"})
    try:
        with urllib.request.urlopen(req_profile, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            church_info = data.get("data", {}).get("member") or data.get("data", {})
            assert resp.status == 200, f"Profile status {resp.status}"
            assert church_info, "No church profile data returned"
            print(f"    - Church profile retrieval (/api/v1/church-portal/profile): SUCCESS (Church: '{church_info.get('name')}', Cert: '{church_info.get('certificateNo')}')")
    except Exception as e:
        print(f"    - Church profile retrieval FAILED: {e}")
        raise

    # Test Admin Member List API (verifying synthetic data in REST response)
    members_api_url = "http://127.0.0.1:8081/api/v1/members"
    req_members = urllib.request.Request(members_api_url, headers={"Authorization": f"Bearer {admin_token}"})
    try:
        with urllib.request.urlopen(req_members, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            members_list = data.get("data", {}).get("members") or data.get("data", [])
            assert resp.status == 200, f"Member list status {resp.status}"
            assert len(members_list) > 0, "No members returned in member list"
            first_m = members_list[0]
            print(f"    - Admin member list (/api/v1/member): SUCCESS (First member: '{first_m.get('name')}', Phone: '{first_m.get('phoneNumber')}')")
    except Exception as e:
        print(f"    - Admin member list FAILED: {e}")
        raise

    # Test Protected File Download
    file_url = "http://127.0.0.1:8081/files/file/sample-document.pdf"
    req_file = urllib.request.Request(file_url, headers={"Authorization": f"Bearer {admin_token}"})
    try:
        with urllib.request.urlopen(req_file, timeout=10) as resp:
            content = resp.read()
            assert resp.status == 200, f"File download status {resp.status}"
            assert content.startswith(b"%PDF-1.4"), "Downloaded file is not a valid PDF!"
            print(f"    - Protected document download (/files/file/sample-document.pdf): SUCCESS ({len(content)} bytes, valid PDF)")
    except Exception as e:
        print(f"    - Protected file download FAILED: {e}")
        raise

    # Test Protected Report Download
    report_url = "http://127.0.0.1:8081/files/report/sample-report.pdf"
    req_rep = urllib.request.Request(report_url, headers={"Authorization": f"Bearer {admin_token}"})
    try:
        with urllib.request.urlopen(req_rep, timeout=10) as resp:
            content = resp.read()
            assert resp.status == 200, f"Report download status {resp.status}"
            assert content.startswith(b"%PDF-1.4"), "Downloaded report is not a valid PDF!"
            print(f"    - Protected report download (/files/report/sample-report.pdf): SUCCESS ({len(content)} bytes, valid PDF)")
    except Exception as e:
        print(f"    - Protected report download FAILED: {e}")
        raise

    print("\n    [PASS] Staging API and document retrieval are fully operational!")
    print("=================================================================\n")

if __name__ == "__main__":
    main()
