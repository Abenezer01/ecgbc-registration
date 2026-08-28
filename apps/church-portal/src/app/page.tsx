import Link from "next/link";
import { ArrowRight, Building2, Hash, LayoutDashboard, CheckCircle2, BookOpen, ShieldCheck, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 font-sans selection:bg-amber-500/30">
      
      {/* HEADER */}
      <header className="absolute top-0 w-full z-50 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-lg shadow-black/10">
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
        </div>
        
        <Link 
          href="/login"
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full backdrop-blur-md border border-white/10 transition-colors"
        >
          Sign In <ArrowRight size={16} />
        </Link>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-40 lg:pt-48 lg:pb-56 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689173/hero-bg_kjbgea.jpg" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-slate-900/70 to-neutral-50 dark:to-neutral-950" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Official Church Portal
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Manage Your Church <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Registration & Profile</span>
          </h1>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            The central platform for member churches and fellowships to register, reserve names, submit annual reports, and manage their congregation seamlessly.
          </p>
        </div>
      </section>

      {/* ACTION CARDS (Pulled up over the hero) */}
      <section className="relative z-20 px-4 -mt-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Reserve Name */}
          <div className="group flex flex-col bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl shadow-black/5 border border-neutral-100 dark:border-neutral-800 hover:-translate-y-1 hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
              <Hash size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Reserve a Name</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-1 mb-8 leading-relaxed">
              Secure a unique name for your church or fellowship before starting the full registration application process.
            </p>
            <Link 
              href="/reserve-name"
              className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors"
            >
              Reserve Now
            </Link>
          </div>

          {/* Card 2: Apply for Registration */}
          <div className="group flex flex-col bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl shadow-black/5 border border-amber-200 dark:border-amber-900/50 hover:-translate-y-1 hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full -z-10" />
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-6">
              <Building2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Apply for Registration</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-1 mb-8 leading-relaxed">
              Ready to officially join? Start your multi-step application process and submit your documents for review.
            </p>
            <Link 
              href="/apply"
              className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all"
            >
              Start Application <ArrowRight size={16} />
            </Link>
          </div>

          {/* Card 3: Dashboard Login */}
          <div className="group flex flex-col bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl shadow-black/5 border border-neutral-100 dark:border-neutral-800 hover:-translate-y-1 hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Manage Your Church</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-1 mb-8 leading-relaxed">
              Already registered? Log in to access your dashboard, submit annual reports, and update your profile.
            </p>
            <Link 
              href="/login"
              className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-24 px-4 bg-white dark:bg-neutral-900 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
              Follow these simple steps to complete your registration and gain access to the ECGBC dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center font-bold text-lg mb-4 z-10 relative">1</div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Reserve a Name</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Submit exactly 5 alternative names to receive a unique Reservation Code.</p>
              <div className="hidden md:block absolute top-6 left-[50%] w-full h-[2px] bg-neutral-100 dark:bg-neutral-800 -z-0" />
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center font-bold text-lg mb-4 z-10 relative">2</div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Submit Application</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Use your Reservation Code to start the application and upload your documents.</p>
              <div className="hidden md:block absolute top-6 left-[50%] w-full h-[2px] bg-neutral-100 dark:bg-neutral-800 -z-0" />
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center font-bold text-lg mb-4 z-10 relative">3</div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Review & Approval</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">ECGBC administrators will review your submitted documents and finalize your church name.</p>
              <div className="hidden md:block absolute top-6 left-[50%] w-full h-[2px] bg-neutral-100 dark:bg-neutral-800 -z-0" />
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 flex items-center justify-center font-bold text-lg mb-4 z-10 relative"><CheckCircle2 size={24} /></div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Access Dashboard</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Upon approval, you'll receive login credentials to manage your church profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REQUIREMENTS SECTION */}
      <section className="py-24 px-4 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">Registration Requirements</h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
            Before starting your application, ensure you have the following information and documents ready.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
          <div className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
                <Hash size={16} />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">5 Proposed Names</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                You will need to provide exactly 5 alternative names in order of preference. We will check availability and assign the highest priority available name.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Official Documents</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Prepare scanned copies (PDF/Image) of required documents such as Support Letters, Charters, and structural documents.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
                <FileText size={16} />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Contact Information</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Accurate location data (Region, Subcity, Woreda) and a dedicated contact person's phone and email address.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
                <BookOpen size={16} />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Council Fellowship</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Identify which Council Fellowship your church belongs to, as this will be required during the structural classification step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" 
              alt="ECGBC Logo" 
              className="w-5 h-5 object-contain grayscale opacity-50"
            />
            <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">ECGBC</span>
          </div>
          <p className="text-xs text-neutral-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} Ethiopian Council of Gospel Believers' Churches. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs font-medium text-neutral-400">
            <Link href="/login" className="hover:text-amber-500 transition-colors">Sign In</Link>
            <Link href="/apply" className="hover:text-amber-500 transition-colors">Register</Link>
            <Link href="/reserve-name" className="hover:text-amber-500 transition-colors">Reserve Name</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
