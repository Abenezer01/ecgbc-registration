"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Download, Clock,
  Building2, MapPin, User, Hash, ChevronDown, ChevronUp,
  Loader2, AlertTriangle, FileImage, FileBadge,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface RegistrationRequest {
  id: string;
  nameAm: string;
  nameEn?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  phoneNumber?: string;
  email?: string;
  city?: string;
  subcity?: string;
  zone?: string;
  district?: string;
  houseNumber?: string;
  poBoxNumber?: string;
  country?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail?: string;
  certificateNo?: string;
  createdAt: string;
  typeId?: string;
  regionId?: string;
  type?: { id: string; description: string };
  region?: { id: string; description: string };
  councilFellowship?: { id: string; name: string };
  reviewer?: { firstName: string; lastName: string };
  remark?: string;
  files?: Array<{ id: string; fileName: string; file: string; category?: { id: string; description: string } }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
};

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? ""))
    return <FileImage className="h-8 w-8 text-blue-500" />;
  if (ext === "pdf") return <FileBadge className="h-8 w-8 text-red-500" />;
  return <FileText className="h-8 w-8 text-neutral-400" />;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">{label}</span>
      <span className="text-sm text-neutral-900 dark:text-neutral-100">{value || <span className="text-neutral-400 italic">Not provided</span>}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2.5">
        <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function ApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<RegistrationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [fellowships, setFellowships] = useState<{ id: string; name: string }[]>([]);
  const [memberTypes, setMemberTypes] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [rejectOpen, setRejectOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [reqRes, fellowRes, typesRes, regionsRes] = await Promise.all([
          api.get(`/registration-requests/${id}`),
          api.get("/council-fellowship-list"),
          api.get("/data-lookups", { params: { type: "MEMBER_TYPE" } }),
          api.get("/data-lookups", { params: { type: "REGION" } }),
        ]);
        const req = reqRes.data?.data;
        setRequest(req);
        setFormData({
          councilFellowshipId: req?.councilFellowship?.id ?? "",
          certificateNo: req?.certificateNo ?? "",
          nameAm: req?.nameAm ?? "",
          nameEn: req?.nameEn ?? "",
          typeId: req?.type?.id ?? req?.typeId ?? "",
          regionId: req?.region?.id ?? req?.regionId ?? "",
          phoneNumber: req?.phoneNumber ?? "",
          email: req?.email ?? "",
          contactPersonName: req?.contactPersonName ?? "",
          contactPersonPhone: req?.contactPersonPhone ?? "",
          contactPersonEmail: req?.contactPersonEmail ?? "",
        });
        const fl = fellowRes.data?.data?.fellowships ?? fellowRes.data?.data ?? [];
        setFellowships(Array.isArray(fl) ? fl : []);
        const ty = typesRes.data?.data?.lookups ?? typesRes.data?.data ?? [];
        setMemberTypes(Array.isArray(ty) ? ty : []);
        const rg = regionsRes.data?.data?.lookups ?? regionsRes.data?.data ?? [];
        setRegions(Array.isArray(rg) ? rg : []);
      } catch {
        toast.error("Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApprove = async () => {
    if (!formData.councilFellowshipId) { toast.error("Please select a Council Fellowship"); return; }
    if (!formData.nameAm) { toast.error("Church Name (Amharic) is required"); return; }
    if (!formData.typeId) { toast.error("Organization Type is required"); return; }
    if (!formData.regionId) { toast.error("Region is required"); return; }
    if (!formData.contactPersonName) { toast.error("Contact Person Name is required"); return; }
    if (!formData.contactPersonPhone) { toast.error("Contact Person Phone is required"); return; }
    setSubmitting(true);
    try {
      await api.post(`/registration-requests/${id}/approve`, {
        ...formData,
        certificateNo: formData.certificateNo || undefined,
      });
      toast.success("Application approved! Church Portal credentials have been created.");
      router.push("/applications");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to approve application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!remark.trim()) { toast.error("Please provide a reason for rejection"); return; }
    setSubmitting(true);
    try {
      await api.post(`/registration-requests/${id}/reject`, { remark });
      toast.success("Application rejected.");
      router.push("/applications");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to reject application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-neutral-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading application...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-neutral-400">
        <AlertTriangle size={40} className="opacity-40" />
        <p>Application not found.</p>
        <button onClick={() => router.push("/applications")} className="text-sm text-amber-600 hover:underline">Back to list</button>
      </div>
    );
  }

  const isPending = request.status === "PENDING";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.registration.ecgbc.org/api/v1";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/applications")}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={15} /> Back to Applications
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-xs">{request.nameAm}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[request.status]}`}>
          {request.status === "PENDING" && <Clock size={11} />}
          {request.status === "APPROVED" && <CheckCircle size={11} />}
          {request.status === "REJECTED" && <XCircle size={11} />}
          {request.status}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT: main content */}
        <div className="flex-1 space-y-5 min-w-0">

          <Section title="Church Information" icon={<Building2 size={15} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow label="Name (Amharic)" value={request.nameAm} />
              <InfoRow label="Name (English)" value={request.nameEn} />
              <InfoRow label="Organization Type" value={request.type?.description} />
              <InfoRow label="Certificate No." value={request.certificateNo} />
              <InfoRow label="Phone" value={request.phoneNumber} />
              <InfoRow label="Email" value={request.email} />
            </div>
          </Section>

          <Section title="Location" icon={<MapPin size={15} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow label="Country" value={request.country} />
              <InfoRow label="Region" value={request.region?.description} />
              <InfoRow label="City / Town" value={request.city} />
              <InfoRow label="Subcity" value={request.subcity} />
              <InfoRow label="Zone" value={request.zone} />
              <InfoRow label="District / Woreda" value={request.district} />
              <InfoRow label="House Number" value={request.houseNumber} />
              <InfoRow label="P.O. Box" value={request.poBoxNumber} />
            </div>
          </Section>

          <Section title="Contact Person" icon={<User size={15} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow label="Full Name" value={request.contactPersonName} />
              <InfoRow label="Phone" value={request.contactPersonPhone} />
              <InfoRow label="Email" value={request.contactPersonEmail} />
            </div>
          </Section>

          <Section title={`Submitted Documents (${request.files?.length ?? 0})`} icon={<FileText size={15} />}>
            {!request.files || request.files.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">No documents were uploaded with this application.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {request.files.map((f) => {
                  // Construct static file URL
                  const baseUrl = apiBase.replace('/api/v1', '');
                  const downloadUrl = `${baseUrl}/files/file/${encodeURIComponent(f.file)}`;
                  
                  return (
                  <a
                    key={f.id}
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all"
                  >
                    <div className="shrink-0"><FileIcon name={f.fileName || f.file} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{f.fileName || f.file}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                        {f.category?.description ?? "Uncategorized"}
                      </span>
                    </div>
                    <Download size={14} className="text-neutral-300 group-hover:text-amber-500 transition-colors shrink-0" />
                  </a>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Collapsible edit section */}
          {isPending && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <button type="button" onClick={() => setEditOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <span className="flex items-center gap-2 uppercase tracking-wide text-xs">
                  <Hash size={14} className="text-neutral-400" />
                  Edit Details Before Approving
                </span>
                {editOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {editOpen && (
                <div className="px-5 pb-5 border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-5">
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    Changes made here are saved when you click "Approve". They do not affect the original submission.
                  </p>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Church Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Church Name (Amharic) *" value={formData.nameAm} onChange={v => setFormData({ ...formData, nameAm: v })} />
                      <Field label="Church Name (English)" value={formData.nameEn} onChange={v => setFormData({ ...formData, nameEn: v })} />
                      <SelectField label="Organization Type *" value={formData.typeId} onChange={v => setFormData({ ...formData, typeId: v })}
                        options={memberTypes.map(t => ({ value: t.id, label: t.description }))} placeholder="Select Type" />
                      <SelectField label="Region *" value={formData.regionId} onChange={v => setFormData({ ...formData, regionId: v })}
                        options={regions.map(r => ({ value: r.id, label: r.description }))} placeholder="Select Region" />
                      <Field label="Phone" value={formData.phoneNumber} onChange={v => setFormData({ ...formData, phoneNumber: v })} />
                      <Field label="Email" type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Contact Person</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Contact Name *" value={formData.contactPersonName} onChange={v => setFormData({ ...formData, contactPersonName: v })} />
                      <Field label="Contact Phone *" value={formData.contactPersonPhone} onChange={v => setFormData({ ...formData, contactPersonPhone: v })} />
                      <Field label="Contact Email" type="email" value={formData.contactPersonEmail} onChange={v => setFormData({ ...formData, contactPersonEmail: v })} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {request.status === "REJECTED" && request.remark && (
            <div className="flex gap-3 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-800 dark:text-red-300">{request.remark}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: sticky sidebar */}
        <div className="lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-6">

          {/* Timeline */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Timeline</h3>
            <div className="flex items-start gap-2.5 text-sm">
              <Clock size={13} className="text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-neutral-700 dark:text-neutral-300 font-medium">Submitted</p>
                <p className="text-xs text-neutral-400">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {request.reviewer && (
              <div className="flex items-start gap-2.5 text-sm">
                <User size={13} className="text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                    {request.status === "APPROVED" ? "Approved by" : "Reviewed by"}
                  </p>
                  <p className="text-xs text-neutral-400">{request.reviewer.firstName} {request.reviewer.lastName}</p>
                </div>
              </div>
            )}
            {request.councilFellowship && (
              <div className="flex items-start gap-2.5 text-sm">
                <Building2 size={13} className="text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-neutral-700 dark:text-neutral-300 font-medium">Fellowship</p>
                  <p className="text-xs text-neutral-400">{request.councilFellowship.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action panel (PENDING only) */}
          {isPending && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Approval Assignment</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Council Fellowship <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.councilFellowshipId}
                    onChange={e => setFormData({ ...formData, councilFellowshipId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Fellowship</option>
                    {fellowships.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Certificate Number</label>
                  <input type="text" value={formData.certificateNo}
                    onChange={e => setFormData({ ...formData, certificateNo: e.target.value })}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>

              <button onClick={handleApprove} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {submitting ? "Approving..." : "Approve & Create Member"}
              </button>

              {!rejectOpen ? (
                <button onClick={() => setRejectOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <XCircle size={14} /> Reject Application
                </button>
              ) : (
                <div className="border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-3 bg-red-50 dark:bg-red-900/10">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">Reason for rejection <span className="text-red-500">*</span></p>
                  <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3}
                    placeholder="Explain why this application is being rejected..."
                    className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-red-500 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setRejectOpen(false)}
                      className="flex-1 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleReject} disabled={submitting}
                      className="flex-1 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-60 transition-colors">
                      {submitting ? "..." : "Confirm Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {request.status === "APPROVED" && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle size={20} className="text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Approved</p>
                <p className="text-xs text-green-600 dark:text-green-400">Member record has been created.</p>
              </div>
            </div>
          )}

          {request.status === "REJECTED" && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <XCircle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Rejected</p>
                <p className="text-xs text-red-600 dark:text-red-400">This application has been rejected.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
