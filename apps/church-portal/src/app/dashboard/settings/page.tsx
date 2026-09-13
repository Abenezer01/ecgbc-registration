"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Lock,
  User,
  Bell,
  Shield,
  Save,
  AlertTriangle,
  Archive,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  FileText,
  Building2,
} from "lucide-react";
import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

interface ChurchClosureRequest {
  id: string;
  memberId: string;
  closureType: "DISSOLUTION" | "LOW_MEMBERSHIP" | "FINANCIAL_HARDSHIP" | "LEADERSHIP_VACANCY" | "EXTERNAL_AMALGAMATION" | "OTHER";
  reason: string;
  resolutionDate?: string | null;
  effectiveDate: string;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  contactPersonEmail?: string | null;
  recordsLocation?: string | null;
  resolutionDocumentUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  submittedByType: "CHURCH_USER" | "STAFF";
  reviewedAt?: string | null;
  reviewRemarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

const CLOSURE_TYPE_LABELS: Record<string, string> = {
  DISSOLUTION: "Assembly Dissolution",
  LOW_MEMBERSHIP: "Low Membership",
  FINANCIAL_HARDSHIP: "Financial Hardship",
  LEADERSHIP_VACANCY: "Leadership Vacancy",
  EXTERNAL_AMALGAMATION: "External Amalgamation",
  OTHER: "Other Voluntary Reason",
};

export default function SettingsPage() {
  const { user, church } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Closure state
  const [closureRequests, setClosureRequests] = useState<ChurchClosureRequest[]>([]);
  const [loadingClosure, setLoadingClosure] = useState(false);
  const [submittingClosure, setSubmittingClosure] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [closureForm, setClosureForm] = useState({
    closureType: "DISSOLUTION" as ChurchClosureRequest["closureType"],
    reason: "",
    resolutionDate: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    contactPersonName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    contactPersonPhone: user?.phone || "",
    contactPersonEmail: user?.email || "",
    recordsLocation: "",
    resolutionDocumentUrl: "",
  });

  const fetchClosureRequests = useCallback(async () => {
    setLoadingClosure(true);
    try {
      const res = await api.get("/church-portal/closure-request");
      const list = res.data?.data ?? [];
      setClosureRequests(Array.isArray(list) ? list : []);
    } catch {
      // ignore silently if endpoint error
    } finally {
      setLoadingClosure(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "closure") {
      fetchClosureRequests();
    }
  }, [activeTab, fetchClosureRequests]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Profile information updated");
    }, 1000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    }, 1000);
  };

  const handleClosureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!closureForm.reason.trim()) {
      toast.error("Please provide the resolution rationale / reason for closure");
      return;
    }

    if (!closureForm.effectiveDate) {
      toast.error("Please specify an effective date");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to submit a formal Voluntary Closure request for "${church?.name || "your church"}"?\n\nThis will initiate headquarters review for self-deactivation. All historical records will be permanently retained in the archives.`
    );
    if (!confirmed) return;

    setSubmittingClosure(true);
    try {
      await api.post("/church-portal/closure-request", {
        closureType: closureForm.closureType,
        reason: closureForm.reason.trim(),
        resolutionDate: closureForm.resolutionDate ? new Date(closureForm.resolutionDate).toISOString() : undefined,
        effectiveDate: new Date(closureForm.effectiveDate).toISOString(),
        contactPersonName: closureForm.contactPersonName.trim() || undefined,
        contactPersonPhone: closureForm.contactPersonPhone.trim() || undefined,
        contactPersonEmail: closureForm.contactPersonEmail.trim() || undefined,
        recordsLocation: closureForm.recordsLocation.trim() || undefined,
        resolutionDocumentUrl: closureForm.resolutionDocumentUrl.trim() || undefined,
      });

      toast.success("Voluntary closure request submitted to headquarters");
      setClosureForm({
        closureType: "DISSOLUTION",
        reason: "",
        resolutionDate: "",
        effectiveDate: new Date().toISOString().split("T")[0],
        contactPersonName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
        contactPersonPhone: user?.phone || "",
        contactPersonEmail: user?.email || "",
        recordsLocation: "",
        resolutionDocumentUrl: "",
      });
      fetchClosureRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit closure request");
    } finally {
      setSubmittingClosure(false);
    }
  };

  const handleCancelClosure = async (requestId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw and cancel this voluntary closure request?"
    );
    if (!confirmed) return;

    setCancellingId(requestId);
    try {
      await api.post("/church-portal/closure-request/cancel", { requestId });
      toast.success("Voluntary closure request cancelled");
      fetchClosureRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel closure request");
    } finally {
      setCancellingId(null);
    }
  };

  const pendingRequest = closureRequests.find((r) => r.status === "PENDING");
  const approvedRequest = closureRequests.find((r) => r.status === "APPROVED");
  const pastRequests = closureRequests.filter((r) => r.status !== "PENDING");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "closure", label: "Voluntary Closure", icon: AlertTriangle },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-0.5">
        <h4 className="text-2xl font-bold text-neutral-900">Settings</h4>
        <p className="text-sm text-neutral-500">Manage your account settings, preferences, and church lifecycle requests.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-56 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? tab.id === "closure"
                    ? "bg-amber-600 text-white"
                    : "bg-primary text-white"
                  : tab.id === "closure"
                  ? "text-amber-700 hover:bg-amber-50"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === "closure" && pendingRequest && (
                <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-neutral-200 p-6">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <h5 className="text-lg font-semibold text-neutral-900 mb-4">Profile Information</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="firstName" label="First Name">
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  />
                </FormField>

                <FormField id="lastName" label="Last Name">
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  />
                </FormField>

                <FormField id="profileEmail" label="Email">
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </FormField>

                <FormField id="profilePhone" label="Phone">
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </FormField>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <Button type="submit" disabled={isSaving} className="gap-1.5">
                  <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h5 className="text-lg font-semibold text-neutral-900 mb-4">Change Password</h5>
              
              <FormField id="currentPassword" label="Current Password">
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </FormField>

              <FormField id="newPassword" label="New Password">
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </FormField>

              <FormField id="confirmPassword" label="Confirm New Password">
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </FormField>

              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <Button type="submit" disabled={isSaving} className="gap-1.5">
                  <Shield className="h-4 w-4" /> {isSaving ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-neutral-900 mb-4">Notification Preferences</h5>
              <p className="text-sm text-neutral-500 italic">Notification settings coming soon.</p>
            </div>
          )}

          {/* VOLUNTARY CLOSURE TAB */}
          {activeTab === "closure" && (
            <div className="space-y-6">
              <div>
                <h5 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Archive className="h-5 w-5 text-amber-600" />
                  Voluntary Closure & Self-Deactivation
                </h5>
                <p className="text-sm text-neutral-500 mt-1">
                  Formal lifecycle request to deactivate church operations, with complete archival retention of all historical records.
                </p>
              </div>

              {loadingClosure ? (
                <div className="flex items-center justify-center h-36 text-neutral-400 gap-2">
                  <Loader2 className="animate-spin" size={18} /> Loading closure status...
                </div>
              ) : pendingRequest ? (
                /* PENDING REQUEST STATE */
                <div className="space-y-5">
                  <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-950 space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">
                          Pending Voluntary Closure Request Under Review
                        </p>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Your church leadership submitted a request to voluntarily close and deactivate this church.
                          This request is currently under administrative review by ECGBC Headquarters.
                          While under review, your church remains active.
                        </p>
                      </div>
                    </div>

                    {/* Summary of submitted request */}
                    <div className="bg-white/80 p-3.5 rounded-lg border border-amber-200 text-xs space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-neutral-500 font-medium">Reason Type:</span>{" "}
                          <span className="font-semibold text-neutral-900">
                            {CLOSURE_TYPE_LABELS[pendingRequest.closureType] || pendingRequest.closureType}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 font-medium">Effective Date:</span>{" "}
                          <span className="font-semibold text-neutral-900">
                            {new Date(pendingRequest.effectiveDate).toLocaleDateString()}
                          </span>
                        </div>
                        {pendingRequest.resolutionDate && (
                          <div>
                            <span className="text-neutral-500 font-medium">Resolution Date:</span>{" "}
                            <span className="text-neutral-900">
                              {new Date(pendingRequest.resolutionDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {pendingRequest.recordsLocation && (
                          <div>
                            <span className="text-neutral-500 font-medium">Records Custody:</span>{" "}
                            <span className="text-neutral-900">{pendingRequest.recordsLocation}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-amber-100">
                        <span className="text-neutral-500 font-medium">Submitted Rationale:</span>
                        <p className="text-neutral-800 mt-1 italic leading-relaxed">
                          "{pendingRequest.reason}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-amber-700">
                        Submitted on {new Date(pendingRequest.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelClosure(pendingRequest.id)}
                        disabled={cancellingId === pendingRequest.id}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs gap-1"
                      >
                        {cancellingId === pendingRequest.id ? (
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Withdraw / Cancel Request
                      </Button>
                    </div>
                  </div>
                </div>
              ) : approvedRequest ? (
                /* APPROVED STATE */
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/80 text-emerald-950 space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">
                        Church Voluntarily Closed & Archived
                      </p>
                      <p className="text-xs text-emerald-800 leading-relaxed mt-1">
                        This church has been voluntarily closed on {new Date(approvedRequest.effectiveDate).toLocaleDateString()}.
                        All financial history, certificate lineage, and board records remain permanently archived.
                        {approvedRequest.reviewRemarks && ` HQ remarks: "${approvedRequest.reviewRemarks}"`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* NEW REQUEST FORM */
                <form onSubmit={handleClosureSubmit} className="space-y-5">
                  {/* Informational Policy Banner */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3 text-xs text-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Important Archival Notice</p>
                      <p className="text-amber-800 leading-relaxed">
                        Submitting this request initiates a formal self-deactivation workflow.
                        Upon headquarters approval, your church will be transitioned to an inactive, closed state and portal credentials will be revoked.
                        <strong> No data is ever deleted:</strong> all historical reports, financial records, lineage links, and certificates remain permanently archived.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField id="closureType" label="Closure Category *" required>
                      <Select
                        id="closureType"
                        value={closureForm.closureType}
                        onChange={(e) =>
                          setClosureForm({
                            ...closureForm,
                            closureType: e.target.value as ChurchClosureRequest["closureType"],
                          })
                        }
                      >
                        <option value="DISSOLUTION">Assembly Dissolution</option>
                        <option value="LOW_MEMBERSHIP">Low Membership / Congregation Dispersal</option>
                        <option value="FINANCIAL_HARDSHIP">Financial Hardship / Operational Inability</option>
                        <option value="LEADERSHIP_VACANCY">Leadership Vacancy / Pastoral Departure</option>
                        <option value="EXTERNAL_AMALGAMATION">Amalgamation into Independent Body</option>
                        <option value="OTHER">Other Voluntary Reason</option>
                      </Select>
                    </FormField>

                    <FormField id="effectiveDate" label="Requested Effective Date *" required>
                      <Input
                        type="date"
                        id="effectiveDate"
                        value={closureForm.effectiveDate}
                        onChange={(e) => setClosureForm({ ...closureForm, effectiveDate: e.target.value })}
                        required
                      />
                    </FormField>

                    <FormField
                      id="resolutionDate"
                      label="Board / Assembly Resolution Date"
                      hint="Date the church board or congregation approved closure"
                    >
                      <Input
                        type="date"
                        id="resolutionDate"
                        value={closureForm.resolutionDate}
                        onChange={(e) => setClosureForm({ ...closureForm, resolutionDate: e.target.value })}
                      />
                    </FormField>

                    <FormField
                      id="recordsLocation"
                      label="Physical Records & Archive Custody Location"
                      hint="Where physical documents and registry books will be kept"
                    >
                      <Input
                        id="recordsLocation"
                        value={closureForm.recordsLocation}
                        onChange={(e) => setClosureForm({ ...closureForm, recordsLocation: e.target.value })}
                        placeholder="e.g. Transferred to Central Fellowship Archive"
                      />
                    </FormField>

                    <FormField id="contactPersonName" label="Contact Person for Archival Queries">
                      <Input
                        id="contactPersonName"
                        value={closureForm.contactPersonName}
                        onChange={(e) => setClosureForm({ ...closureForm, contactPersonName: e.target.value })}
                        placeholder="Elder / Contact person name"
                      />
                    </FormField>

                    <FormField id="contactPersonPhone" label="Contact Phone">
                      <Input
                        id="contactPersonPhone"
                        value={closureForm.contactPersonPhone}
                        onChange={(e) => setClosureForm({ ...closureForm, contactPersonPhone: e.target.value })}
                        placeholder="+251..."
                      />
                    </FormField>
                  </div>

                  <FormField
                    id="reason"
                    label="Detailed Rationale & Board Resolution Summary *"
                    hint="Provide comprehensive details regarding the decision to close, assets disposition, and member transition plan"
                    required
                  >
                    <Textarea
                      id="reason"
                      rows={4}
                      value={closureForm.reason}
                      onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })}
                      placeholder="Explain the background, decisions taken during congregational meeting, asset handover plans, etc."
                      required
                    />
                  </FormField>

                  <FormField
                    id="resolutionDocumentUrl"
                    label="Minutes / Resolution Document Link (Optional)"
                    hint="URL to scanned minutes, board resolution document, or signed transition protocol"
                  >
                    <Input
                      id="resolutionDocumentUrl"
                      type="url"
                      value={closureForm.resolutionDocumentUrl}
                      onChange={(e) => setClosureForm({ ...closureForm, resolutionDocumentUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </FormField>

                  <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                    <Button
                      type="submit"
                      disabled={submittingClosure || !closureForm.reason.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                    >
                      {submittingClosure ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4" /> Submit Voluntary Closure Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* PAST REQUESTS HISTORY */}
              {pastRequests.length > 0 && (
                <div className="pt-6 border-t border-neutral-200 space-y-3">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Past Closure Requests
                  </h6>
                  <div className="space-y-2">
                    {pastRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-lg border border-neutral-200 text-xs flex items-center justify-between bg-neutral-50"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-neutral-800">
                            {CLOSURE_TYPE_LABELS[req.closureType] || req.closureType} — {req.status}
                          </p>
                          <p className="text-neutral-500">
                            Effective: {new Date(req.effectiveDate).toLocaleDateString()} • Submitted: {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                          {req.reviewRemarks && (
                            <p className="text-neutral-600 italic">HQ Remarks: "{req.reviewRemarks}"</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-neutral-200 text-neutral-700"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

