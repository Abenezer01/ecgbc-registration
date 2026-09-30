"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  HelpCircle 
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.registration.ecgbc.org/api/v1",
  headers: { "Content-Type": "application/json" },
});

const SAMPLE_EXAMPLES = [
  {
    nameAm: "የሕይወት ቃል ወንጌላዊት ቤተክርስቲያን",
    nameEn: "Word of Life Evangelical Church",
  },
  {
    nameAm: "ጸጋና እውነት ዓለም አቀፍ ቤተክርስቲያን",
    nameEn: "Grace and Truth International Church",
  },
  {
    nameAm: "አዲስ ኪዳን ካህናት ኅብረት",
    nameEn: "New Covenant Priesthood Fellowship",
  },
  {
    nameAm: "ብርሃነ ወንጌል አማኞች ቤተክርስቲያን",
    nameEn: "Light of the Gospel Believers Church",
  },
  {
    nameAm: "ተስፋ ሕይወት መጥምቃዊት ቤተክርስቲያን",
    nameEn: "Living Hope Baptist Church",
  },
];

export default function CheckNamePage() {
  const router = useRouter();

  const [nameAm, setNameAm] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!nameAm.trim()) {
      toast.error("Please enter a church name in Amharic.");
      return;
    }

    setIsChecking(true);
    setHasChecked(false);

    try {
      const { data } = await publicApi.post("/name-reservations/public/check", {
        nameAm: nameAm.trim(),
        nameEn: nameEn.trim(),
      });

      const foundMatches = data.data?.matches || [];
      setIsAvailable(foundMatches.length === 0);
      setHasChecked(true);

      if (foundMatches.length === 0) {
        toast.success("Name is available!");
      } else {
        toast.error("This name is not available. Please try a different name.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to check name availability. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSelectExample = (ex: typeof SAMPLE_EXAMPLES[0]) => {
    setNameAm(ex.nameAm);
    setNameEn(ex.nameEn);
    setHasChecked(false);
  };

  const handleProceedToReserve = () => {
    const params = new URLSearchParams();
    if (nameAm) params.set("nameAm", nameAm);
    if (nameEn) params.set("nameEn", nameEn);
    router.push(`/reserve-name?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 font-sans selection:bg-amber-500/30">
      <Toaster position="top-center" />

      {/* HEADER */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-md">
              <img 
                src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" 
                alt="ECGBC Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="flex flex-col text-white">
              <span className="font-bold text-[9px] leading-tight tracking-[0.15em] uppercase text-white/80">Ethiopian Council of</span>
              <span className="font-black text-sm leading-none tracking-tight uppercase">Gospel Believers' Churches</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/"
              className="text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/reserve-name"
              className="text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors hidden sm:block"
            >
              Reserve Name
            </Link>
            <Link 
              href="/login"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-colors"
            >
              Sign In <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-850 to-neutral-900 text-white pt-12 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            Public Name Verification Tool
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Check Church Name <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400">
              Availability & Conflicts
            </span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Verify if your proposed church or fellowship name is unique and available before submitting a formal reservation or registration application.
          </p>
        </div>
      </section>

      {/* MAIN CHECKER CARD (Shifted Upwards) */}
      <main className="max-w-4xl mx-auto w-full px-4 -mt-10 pb-16 space-y-8 flex-1">
        
        {/* Search / Form Box */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-black/5 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6">
          
          <form onSubmit={handleCheck} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Church Name (Amharic / በአማርኛ) <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ምሳሌ፡ የሕይወት ቃል ወንጌላዊት ቤተክርስቲያን"
                  value={nameAm}
                  onChange={(e) => {
                    setNameAm(e.target.value);
                    setHasChecked(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Church Name (English / እንግሊዝኛ) <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Word of Life Evangelical Church"
                  value={nameEn}
                  onChange={(e) => {
                    setNameEn(e.target.value);
                    setHasChecked(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Clickable Example Suggestions */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold">Click to try sample names / ምሳሌዎችን ሞክር:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectExample(ex)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-amber-100/70 text-neutral-700 hover:text-amber-900 dark:bg-neutral-800 dark:hover:bg-amber-950/60 dark:text-neutral-300 dark:hover:text-amber-200 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                  >
                    {ex.nameAm}
                  </button>
                ))}
              </div>
            </div>

            {/* Check Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isChecking || !nameAm.trim()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking Availability...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Check Availability
                  </>
                )}
              </button>
            </div>
          </form>

          {/* CHECK RESULTS AREA */}
          {hasChecked && (
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in duration-300">
              {isAvailable ? (
                <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-900 dark:text-green-300">
                        Name is Available! / ስሙ ክፍት ነው
                      </h3>
                      <p className="text-sm text-green-800/80 dark:text-green-400/90 mt-1 leading-relaxed">
                        No registered or reserved churches under ECGBC share this name. You can proceed to reserve this name as your primary choice.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleProceedToReserve}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all"
                    >
                      Reserve This Name Now <ArrowRight size={16} />
                    </button>
                    <Link
                      href="/apply"
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-green-800 dark:text-green-300 bg-green-100/80 hover:bg-green-200/80 dark:bg-green-900/40 dark:hover:bg-green-900/60 transition-colors"
                    >
                      Apply for Registration
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">
                        Name Not Available / ስሙ ክፍት አይደለም
                      </h3>
                      <p className="text-sm text-amber-800/80 dark:text-amber-400/90 mt-1 leading-relaxed">
                        This name or a closely similar name is already registered or reserved under the council registry. To avoid conflict and ensure approval, please choose a different or more distinct church name.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-amber-200/60 dark:border-amber-900/40 text-xs text-neutral-700 dark:text-neutral-300 space-y-2">
                    <p className="font-semibold text-amber-900 dark:text-amber-300">
                      Suggestions for choosing an available name / ምክረ-ሀሳብ፡
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-neutral-600 dark:text-neutral-400">
                      <li>Add a specific location or branch indicator (e.g., አጥቢያ, ወረዳ, ከተማ).</li>
                      <li>Incorporate a unique ministry vision or distinctive theological term.</li>
                      <li>Ensure proper church classification (e.g., ቤተክርስቲያን or ኅብረት).</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* GUIDELINES & POLICY CARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">Classification Required</h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Every church name must explicitly include its classification suffix (e.g. <span className="font-semibold text-neutral-800 dark:text-neutral-200">ቤተክርስቲያን</span> or <span className="font-semibold text-neutral-800 dark:text-neutral-200">ኅብረት</span>).
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">3 Alternative Choices</h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              When officially submitting a name reservation, you must provide 3 choices in order of preference in case of prior claim.
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">Official Language</h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              The primary legal name must be written in Amharic script (Ge'ez). English translation can be optionally appended.
            </p>
          </div>
        </div>

        {/* BOTTOM CALL TO ACTION */}
        <div className="bg-gradient-to-r from-slate-900 to-neutral-900 rounded-2xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-neutral-800">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold">Have your preferred names ready?</h3>
            <p className="text-sm text-neutral-400">
              Submit your 3 alternative choices to obtain an official reservation code.
            </p>
          </div>
          <Link
            href="/reserve-name"
            className="shrink-0 px-6 py-3 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            Go to Name Reservation <ArrowRight size={16} />
          </Link>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-6 px-4 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} Ethiopian Council of Gospel Believers' Churches (ECGBC). All rights reserved.</p>
      </footer>
    </div>
  );
}
