"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.registration.ecgbc.org/api/v1",
  headers: { "Content-Type": "application/json" },
});

function ReserveNameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [checkingIndex, setCheckingIndex] = useState<number | null>(null);
  const [proposedNames, setProposedNames] = useState([
    { nameAm: "", nameEn: "" },
    { nameAm: "", nameEn: "" },
    { nameAm: "", nameEn: "" }
  ]);
  
  const [formData, setFormData] = useState({
    publicName: "",
    publicPhone: "",
    publicEmail: "",
  });
  
  const [nameCheckResult, setNameCheckResult] = useState<{ isAvailable: boolean; matches: any[]; index?: number } | null>(null);
  const [success, setSuccess] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  useEffect(() => {
    const nameAm = searchParams.get("nameAm");
    const nameEn = searchParams.get("nameEn");
    if (nameAm || nameEn) {
      setProposedNames((prev) => {
        const next = [...prev];
        next[0] = { nameAm: nameAm || "", nameEn: nameEn || "" };
        return next;
      });
    }
  }, [searchParams]);

  const handleNameChange = (index: number, field: "nameAm" | "nameEn", value: string) => {
    const newNames = [...proposedNames];
    newNames[index][field] = value;
    setProposedNames(newNames);
  };


  const checkAvailability = async (index: number) => {
    const pn = proposedNames[index];
    if (!pn.nameAm.trim()) {
      toast.error(`Please enter Church Name (Amharic) for Choice ${index + 1}.`);
      return;
    }
    setCheckingIndex(index);
    try {
      const { data } = await publicApi.post("/name-reservations/public/check", { 
        nameAm: pn.nameAm, 
        nameEn: pn.nameEn 
      });
      const matches = data.data?.matches || [];
      setNameCheckResult({
        isAvailable: matches.length === 0,
        matches,
        index
      });
    } catch (err: any) {
      toast.error("Failed to check name availability.");
    } finally {
      setCheckingIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (proposedNames.some(pn => !pn.nameAm.trim())) {
      toast.error("Please provide all 3 alternative choices.");
      return;
    }
    if (!formData.publicName.trim() || (!formData.publicPhone.trim() && !formData.publicEmail.trim())) {
      toast.error("Please fill all required requester fields.");
      return;
    }

    try {
      setIsLoading(true);
      const validProposed = proposedNames.filter(n => n.nameAm.trim() !== "");
      
      const payload = {
        nameAm: validProposed[0].nameAm,
        nameEn: validProposed[0].nameEn,
        proposedNames: validProposed,
        ...formData
      };
      
      const { data } = await publicApi.post("/name-reservations/public/request", payload);
      setSuccessCode(data.data?.reservation?.reservationCode || "UNKNOWN");
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to submit reservation request.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950 items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Request Submitted!</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            Your name reservation request has been received. Please keep the following reservation code safe. You will need it to apply for registration once approved.
          </p>
          
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 mb-8">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">Reservation Code</p>
            <p className="text-3xl font-mono font-black text-amber-600 dark:text-amber-500">{successCode}</p>
          </div>
          
          <button
            onClick={() => router.push("/")}
            className="w-full px-6 py-3 rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950">
      <Toaster position="top-center" />
      
      {/* Left Side: Brand & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden p-12 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689173/hero-bg_kjbgea.jpg" 
            alt="ECGBC Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
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
            <span className="font-black text-lg leading-none tracking-tight uppercase text-white">Gospel Believers' Churches</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md mt-auto pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Official Church Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Reserve your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-300">Church Name.</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed mb-6">
            Secure a unique name for your church or fellowship before starting the full registration process.
          </p>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 space-y-2">
            <div className="font-semibold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Naming Requirements & Examples:
            </div>
            <ul className="space-y-1 list-disc pl-4 text-white/80">
              <li>Must include classification (e.g., ቤተክርስቲያን or ኅብረት)</li>
              <li>Provide 3 unique alternative choices in priority order</li>
              <li>Instant verification against existing registered names</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 h-screen overflow-y-auto">
        <div className="mx-auto w-full max-w-lg my-auto pb-8 pt-12">
          
          <button onClick={() => router.push("/login")} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to login
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">Reserve Name</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Submit exactly 3 alternative names in order of preference to secure one for your future registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Guidelines Card */}
            <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-4">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Naming Guidelines / የስም አሰያየም መመሪያ
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                    Names must explicitly include your church classification (e.g., <span className="font-semibold text-neutral-800 dark:text-neutral-200">ቤተክርስቲያን</span> or <span className="font-semibold text-neutral-800 dark:text-neutral-200">ኅብረት</span>). Provide exactly 3 prioritized alternatives.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Proposed Names</h3>
              <div className="space-y-4">
                {proposedNames.map((pn, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border relative overflow-hidden ${idx === 0 ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 shadow-sm" : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50"}`}>
                    
                    {idx === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>}
                    
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        {idx === 0 ? "Primary Choice" : `Alternative Choice ${idx}`} 
                        <span className="text-amber-500 ml-1">*</span>
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => checkAvailability(idx)}
                          disabled={checkingIndex !== null}
                          className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium disabled:opacity-50 transition-colors"
                        >
                          {checkingIndex === idx ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            "Check Availability"
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                          Amharic Name *
                        </label>
                        <input 
                          required={true} 
                          type="text" 
                          placeholder="የቤተክርስቲያን ስም (በአማርኛ)"
                          value={pn.nameAm} 
                          onChange={(e) => handleNameChange(idx, "nameAm", e.target.value)} 
                          className="w-full px-4 py-2.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-1 focus:ring-slate-900 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                          English Name (Optional)
                        </label>
                        <input 
                          type="text" 
                          placeholder="English Name (Optional)"
                          value={pn.nameEn} 
                          onChange={(e) => handleNameChange(idx, "nameEn", e.target.value)} 
                          className="w-full px-4 py-2.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-1 focus:ring-slate-900 outline-none" 
                        />
                      </div>
                    </div>
                    
                    {nameCheckResult && nameCheckResult.index === idx && (
                      <div className={`mt-3 p-3 rounded-lg text-sm border animate-in fade-in zoom-in-95 duration-300 ${nameCheckResult.isAvailable ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-300" : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-300"}`}>
                        {nameCheckResult.isAvailable ? (
                          <div className="flex items-center gap-2"><CheckCircle size={16} /> Name looks available!</div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div>
                              <p className="font-semibold text-xs text-amber-800 dark:text-amber-300">Name is not available</p>
                              <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                                A matching or closely similar church name is already registered or reserved under the council. Please choose a different name.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Requester Details</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ፓስተር ዮሐንስ አበበ / Pastor Yohannes Abebe"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-1 focus:ring-slate-900 outline-none"
                  value={formData.publicName}
                  onChange={(e) => setFormData({ ...formData, publicName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0911234567 or +251911234567"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-1 focus:ring-slate-900 outline-none"
                  value={formData.publicPhone}
                  onChange={(e) => setFormData({ ...formData, publicPhone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. info@church.org"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-1 focus:ring-slate-900 outline-none"
                  value={formData.publicEmail}
                  onChange={(e) => setFormData({ ...formData, publicEmail: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Reservation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReserveNamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <ReserveNameContent />
    </Suspense>
  );
}
