"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Key, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldAlert, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { PageHeader, Button, Badge, Modal, Input, Label, Textarea, Spinner } from "@/components/ui";
import { useApiKeys, ApiKeyItem } from "@/hooks/useApiKeys";

const AVAILABLE_SCOPES = [
  { id: "members:read", label: "Read Members Directory", description: "Search, filter, and view member profiles." },
  { id: "members:verify", label: "Verify Certificates", description: "Validate standing and certificate numbers." },
  { id: "members:leadership", label: "View Leadership & Board", description: "Include board members and titles in queries." },
];

export default function ApiKeysPage() {
  const {
    keys,
    loading,
    error,
    createKey,
    toggleKeyStatus,
    regenerateKey,
    deleteKey,
  } = useApiKeys();

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scopes: ["members:read", "members:verify"],
    rateLimit: 60,
    allowedIps: "",
  });

  // Secret Key Display Modal State
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete Confirmation State
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyItem | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await createKey({
        name: formData.name,
        description: formData.description,
        scopes: formData.scopes,
        rateLimit: Number(formData.rateLimit) || 60,
        allowedIps: formData.allowedIps || undefined,
      });
      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        scopes: ["members:read", "members:verify"],
        rateLimit: 60,
        allowedIps: "",
      });
      setRevealedKey(res.plainKey);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create API key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async (item: ApiKeyItem) => {
    if (!confirm(`Are you sure you want to regenerate the API key for '${item.name}'? Any existing integrations using this key will immediately stop working.`)) {
      return;
    }
    try {
      const res = await regenerateKey(item.id);
      setRevealedKey(res.plainKey);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to regenerate API key.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!keyToDelete) return;
    try {
      await deleteKey(keyToDelete.id);
      setKeyToDelete(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete API key.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/settings" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="API Keys & Integrations"
          description="Manage secure machine-to-machine API access for external applications and partner systems."
        />
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:5000/api/v1/external/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <BookOpen className="h-4 w-4" /> API Docs
          </a>
          <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Generate API Key
          </Button>
        </div>
      </div>

      {/* Main Table / Content */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <Spinner className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-sm text-zinc-500">Loading API keys...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="font-medium">{error}</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <Key className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">No API Keys Generated</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-4">
              Issue an API key to allow external applications (mobile apps, finance systems, or national directories) to query member church data.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Generate First Key
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3">Application</th>
                  <th className="px-5 py-3">Key Identifier</th>
                  <th className="px-5 py-3">Scopes</th>
                  <th className="px-5 py-3">Rate Limit</th>
                  <th className="px-5 py-3">Last Used</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-white">{k.name}</div>
                      {k.description && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{k.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs text-zinc-700 dark:text-zinc-300">
                        {k.keyPrefix}
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(k.scopes || []).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[11px] py-0 px-2 font-mono">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                      {k.rateLimit} req/min
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-500">
                      {k.lastUsedAt ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(k.lastUsedAt).toLocaleDateString()} {new Date(k.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="italic text-zinc-400">Never used</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleKeyStatus(k.id, k.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          k.isActive
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                        }`}
                        title="Click to toggle status"
                      >
                        {k.isActive ? "Active" : "Revoked"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerate(k)}
                        title="Rotate / Regenerate secret key"
                        className="text-zinc-500 hover:text-blue-600"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setKeyToDelete(k)}
                        title="Delete key"
                        className="text-zinc-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => !isSubmitting && setIsCreateOpen(false)}
        title="Generate External API Key"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <Label htmlFor="appName" className="required">Application / System Name</Label>
            <Input
              id="appName"
              placeholder="e.g. ECGBC Mobile App, National Finance Service"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="appDesc">Description</Label>
            <Textarea
              id="appDesc"
              placeholder="Brief note on what this integration is used for..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label>Permissions / Scopes</Label>
            <div className="space-y-2 mt-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
              {AVAILABLE_SCOPES.map((scope) => {
                const checked = formData.scopes.includes(scope.id);
                return (
                  <label key={scope.id} className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, scopes: [...formData.scopes, scope.id] });
                        } else {
                          setFormData({
                            ...formData,
                            scopes: formData.scopes.filter((s) => s !== scope.id),
                          });
                        }
                      }}
                      className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{scope.label}</p>
                      <p className="text-xs text-zinc-500">{scope.description} (<code className="text-xs">{scope.id}</code>)</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rateLimit">Rate Limit (req / min)</Label>
              <Input
                id="rateLimit"
                type="number"
                min="10"
                max="1000"
                value={formData.rateLimit}
                onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) || 60 })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="allowedIps">IP Whitelist (Optional)</Label>
              <Input
                id="allowedIps"
                placeholder="Comma separated IPs"
                value={formData.allowedIps}
                onChange={(e) => setFormData({ ...formData, allowedIps: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Generating..." : "Generate Key"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* One-Time Secret Key Revealed Modal */}
      <Modal
        open={Boolean(revealedKey)}
        onClose={() => setRevealedKey(null)}
        title="Your Secret API Key"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">Save your key in a secure location.</p>
              <p className="text-xs mt-0.5 opacity-90">
                This secret key is only shown once. It will not be stored in plaintext and cannot be recovered later.
              </p>
            </div>
          </div>

          <div>
            <Label>API Key</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={revealedKey || ""}
                className="w-full font-mono text-sm px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 select-all"
              />
              <Button
                type="button"
                onClick={() => revealedKey && copyToClipboard(revealedKey)}
                className="shrink-0 flex items-center gap-1.5"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs text-zinc-500 font-mono space-y-1">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300 font-sans">Example cURL Request:</p>
            <p className="text-blue-600 dark:text-blue-400 break-all">
              curl -H &quot;X-API-Key: {revealedKey}&quot; http://localhost:5000/api/v1/external/members
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setRevealedKey(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(keyToDelete)}
        onClose={() => setKeyToDelete(null)}
        title="Revoke and Delete API Key"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Are you sure you want to permanently delete the API key for{" "}
            <strong>{keyToDelete?.name}</strong>?
          </p>
          <p className="text-xs text-red-500">
            Any external applications using this key will immediately receive HTTP 401 Unauthorized errors.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="ghost" onClick={() => setKeyToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Revoke & Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
