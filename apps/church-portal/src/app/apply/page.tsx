"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, FileText, X, UploadCloud } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Standalone public axios — no auth interceptors, no localStorage access
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.registration.ecgbc.org/api/v1",
  headers: { "Content-Type": "application/json" },
});

const cn = (...inputs: any[]) => twMerge(clsx(inputs));

// ── File validation constants (mirror AddMemberModal) ──
const MAX_FILES = 10;
const MAX_PER_FILE_SIZE_MB = 5;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_PER_FILE_SIZE_BYTES = MAX_PER_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface DataLookup {
  id: string;
  type: string;
  value: string;
  description: string;
  isRequired?: boolean;
}

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Lookups
  const [memberTypes, setMemberTypes] = useState<DataLookup[]>([]);
  const [regions, setRegions] = useState<DataLookup[]>([]);

  const [formData, setFormData] = useState({
    nameAm: "",
    nameEn: "",
    typeId: "",
    councilFellowshipId: "",
    certificateNo: "",
    regionId: "",
    country: "Ethiopia",
    city: "",
    subcity: "",
    zone: "",
    district: "",
    houseNumber: "",
    phoneNumber: "",
    email: "",
    poBoxNumber: "",
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: ""
  });
  const [files, setFiles] = useState<File[]>([]);
  const [fileCategories, setFileCategories] = useState<Record<number, string>>({});
  const [documentTypes, setDocumentTypes] = useState<DataLookup[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [perFileErrors, setPerFileErrors] = useState<Record<number, string>>({});

  const runValidation = (newFiles: File[], newCategories: Record<number, string>, docTypes: DataLookup[]) => {
    const errors: string[] = [];
    const perErrors: Record<number, string> = {};

    if (newFiles.length > MAX_FILES) {
      errors.push(`Maximum of ${MAX_FILES} files allowed. You have ${newFiles.length}.`);
    }
    const totalSize = newFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      errors.push(`Total size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds the ${MAX_TOTAL_SIZE_MB}MB limit.`);
    }
    newFiles.forEach((file, idx) => {
      if (file.size > MAX_PER_FILE_SIZE_BYTES) {
        perErrors[idx] = `"${file.name}" exceeds the ${MAX_PER_FILE_SIZE_MB}MB per-file limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`;
      } else if (!newCategories[idx]) {
        perErrors[idx] = `Please select a document category for "${file.name}".`;
      }
    });

    const requiredIds = docTypes.filter(c => c.isRequired).map(c => c.id);
    const uploadedIds = Object.values(newCategories);
    const missing = requiredIds.filter(id => !uploadedIds.includes(id));
    if (missing.length > 0) {
      errors.push(`${missing.length} required document(s) not yet uploaded. Please check the required list.`);
    }

    setFileErrors(errors);
    setPerFileErrors(perErrors);
    return { hasErrors: Object.keys(perErrors).length > 0 || errors.length > 0 };
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [typesRes, regionsRes, docTypesRes] = await Promise.all([
          publicApi.get("/data-lookups?type=MEMBER_TYPE"),
          publicApi.get("/data-lookups?type=REGION"),
          publicApi.get("/data-lookups?type=Document Type")
        ]);
        const types = typesRes.data?.data?.lookups ?? typesRes.data?.data ?? [];
        const regs = regionsRes.data?.data?.lookups ?? regionsRes.data?.data ?? [];
        const docs = docTypesRes.data?.data?.lookups ?? docTypesRes.data?.data ?? [];
        
        setMemberTypes(Array.isArray(types) ? types : []);
        setRegions(Array.isArray(regs) ? regs : []);
        setDocumentTypes(Array.isArray(docs) ? docs : []);
      } catch (error) {
        toast.error("Failed to load form options");
      }
    };
    fetchLookups();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const merged = [...files];
    for (const f of incoming) {
      if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f);
    }
    setFiles(merged);
    runValidation(merged, fileCategories, documentTypes);
    e.target.value = "";
  };

  const handleCategoryChange = (idx: number, catId: string) => {
    const next = { ...fileCategories, [idx]: catId };
    setFileCategories(next);
    runValidation(files, next, documentTypes);
  };

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    const nextCats: Record<number, string> = {};
    Object.entries(fileCategories).forEach(([k, v]) => {
      const ki = parseInt(k);
      if (ki < idx) nextCats[ki] = v;
      else if (ki > idx) nextCats[ki - 1] = v;
    });
    setFiles(next);
    setFileCategories(nextCats);
    runValidation(next, nextCats, documentTypes);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setFileCategories({});
    setFileErrors([]);
    setPerFileErrors({});
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.nameAm || !formData.typeId) {
        toast.error("Please fill all required fields");
        return;
      }
    } else if (step === 2) {
      if (!formData.regionId || !formData.phoneNumber) {
        toast.error("Please fill all required location fields");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactPersonName || !formData.contactPersonPhone) {
      toast.error("Please provide contact person details");
      return;
    }
    
    setIsLoading(true);

    // Full file validation
    const { hasErrors } = runValidation(files, fileCategories, documentTypes);
    if (hasErrors) {
      toast.error("Please fix the file errors before submitting.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });
      files.forEach(f => payload.append('memberFiles', f));
      
      const categoryIds = files.map((_, idx) => fileCategories[idx] || "");
      payload.append('fileCategoryIds', JSON.stringify(categoryIds));

      await publicApi.post("/registration-requests/public/apply", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setStep(4); // Success step
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit application");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950">
      <Toaster position="top-center" />
      
      {/* Left Side: Brand & Visual */}
      <div className="hidden lg:flex lg:w-1/3 relative flex-col justify-between overflow-hidden p-12 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689173/hero-bg_kjbgea.jpg" 
            alt="ECGBC Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-xl shadow-black/20">
            <img 
              src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" 
              alt="ECGBC Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[10px] leading-tight tracking-[0.1em] uppercase text-white/80">Ethiopian Council of</span>
            <span className="font-black text-lg leading-none tracking-tight uppercase text-white">Gospel Believers'</span>
          </div>
        </div>

        <div className="relative z-10 mt-auto pb-12">
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Join the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-300">ECGBC Network.</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Submit your church or ministry's application online. Our administration team will review your details.
          </p>
        </div>
      </div>

      {/* Right Side: Application Form */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        
        {step < 4 && (
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full z-0"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-500 rounded-full z-0 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
              
              {[1, 2, 3].map((num) => (
                <div key={num} className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300", step >= num ? "bg-amber-500 text-white" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300")}>
                  {num}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <span>Church Info</span>
              <span>Location</span>
              <span>Contact Person</span>
            </div>
          </div>
        )}

        <div className="w-full max-w-2xl mx-auto">
          {step === 4 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">Application Submitted!</h2>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-8">
                Thank you for applying to join ECGBC. Our administration team will review your application and contact you soon. Once approved, you will receive an email with your Church Portal login credentials.
              </p>
              <button onClick={() => router.push("/")} className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 transition-colors">
                Return to Home
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  {step === 1 && "Church Identity"}
                  {step === 2 && "Location Details"}
                  {step === 3 && "Key Contact Person"}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Please provide accurate information to expedite your application process.
                </p>
              </div>

              <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
                
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Church Name (Amharic) *</label>
                        <input required type="text" name="nameAm" value={formData.nameAm} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Church Name (English)</label>
                        <input type="text" name="nameEn" value={formData.nameEn} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Organization Type *</label>
                      <select required name="typeId" value={formData.typeId} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500">
                        <option value="">Select Type</option>
                        {memberTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.description}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Government Certificate No. (Optional)</label>
                      <input type="text" name="certificateNo" value={formData.certificateNo} onChange={handleChange} placeholder="e.g., 1234/2016" className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Region *</label>
                        <select required name="regionId" value={formData.regionId} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500">
                          <option value="">Select Region</option>
                          {regions.map(r => (
                            <option key={r.id} value={r.id}>{r.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">City/Town</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Woreda / District</label>
                        <input type="text" name="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">House Number</label>
                        <input type="text" name="houseNumber" value={formData.houseNumber} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Office Phone *</label>
                        <input required type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Office Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm mb-4">
                      This person will be the primary point of contact for ECGBC administration regarding your application.
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Full Name *</label>
                        <input required type="text" name="contactPersonName" value={formData.contactPersonName} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone Number *</label>
                        <input required type="text" name="contactPersonPhone" value={formData.contactPersonPhone} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email Address (Optional)</label>
                        <input type="email" name="contactPersonEmail" value={formData.contactPersonEmail} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Supporting Documents</h3>
                      <div className="space-y-4">

                        {/* Required docs checklist */}
                        {documentTypes.filter((c) => c.isRequired).length > 0 && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Required Documents:</p>
                            <ul className="text-xs space-y-1.5">
                              {documentTypes.filter((c) => c.isRequired).map((c) => {
                                const isUploaded = Object.values(fileCategories).includes(c.id);
                                return (
                                  <li key={c.id} className="flex items-center gap-2">
                                    {isUploaded
                                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                      : <div className="h-3.5 w-3.5 rounded-full border-2 border-neutral-300 shrink-0" />}
                                    <span className={isUploaded ? "line-through text-neutral-400" : "text-blue-700 dark:text-blue-400"}>
                                      {c.description}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Global file errors */}
                        {fileErrors.length > 0 && (
                          <div className="space-y-1">
                            {fileErrors.map((fe, i) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs border border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {fe}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Drop zone */}
                        <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors relative">
                          <input type="file" multiple accept={ACCEPTED_TYPES} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <UploadCloud className="h-9 w-9 text-neutral-400 mb-2" />
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Click or drag & drop files here</p>
                          <p className="text-xs text-neutral-500 mt-1">PDF, DOC, PNG, JPG · Max {MAX_FILES} files · {MAX_PER_FILE_SIZE_MB}MB per file · {MAX_TOTAL_SIZE_MB}MB total</p>
                        </div>

                        {/* File list */}
                        {files.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
                              <span>Selected Files ({files.length}/{MAX_FILES})</span>
                              <button type="button" onClick={clearAllFiles} className="hover:text-red-500 transition-colors">Clear All</button>
                            </div>
                            {files.map((file, idx) => (
                              <div key={idx} className={`rounded-lg border text-sm transition-colors ${perFileErrors[idx] ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20" : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50"}`}>
                                <div className="flex items-center gap-3 p-2.5">
                                  <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate font-medium text-neutral-900 dark:text-white">{file.name}</p>
                                    <p className="text-xs text-neutral-400">{formatBytes(file.size)}</p>
                                  </div>
                                  <select
                                    value={fileCategories[idx] || ""}
                                    onChange={e => handleCategoryChange(idx, e.target.value)}
                                    className="w-40 px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                                  >
                                    <option value="">Select Category...</option>
                                    {documentTypes.map(type => (
                                      <option key={type.id} value={type.id}>{type.description}{type.isRequired ? " (Required)" : ""}</option>
                                    ))}
                                  </select>
                                  <button type="button" onClick={() => removeFile(idx)} className="text-neutral-400 hover:text-red-500 transition-colors shrink-0 p-0.5">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                {perFileErrors[idx] && (
                                  <p className="px-3 pb-2 text-xs text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 shrink-0" /> {perFileErrors[idx]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 flex justify-between">
                      <button type="button" onClick={prevStep} className="px-6 py-2 rounded-lg font-medium border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 transition-colors">
                        <span className="flex items-center gap-2"><ArrowLeft size={16} /> Back</span>
                      </button>
                      <button type="submit" disabled={isLoading} className="px-8 py-2 rounded-lg font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[140px]">
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span className="flex items-center gap-2">Submit <CheckCircle2 size={16} /></span>}
                      </button>
                    </div>
                  </div>
                )}

                {step < 3 && (
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-800">
                    {step > 1 ? (
                      <button type="button" onClick={prevStep} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                        <ArrowLeft size={16} /> Back
                      </button>
                    ) : (
                      <div></div>
                    )}
                    
                    <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm">
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
