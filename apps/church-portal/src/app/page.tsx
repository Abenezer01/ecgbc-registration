import Link from "next/link";
import { ArrowRight, Building2, Hash, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-lg">
            <img 
              src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" 
              alt="ECGBC Logo" 
              className="w-6 h-6 object-contain" 
            />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="font-bold text-[9px] leading-tight tracking-[0.1em] uppercase text-white/90">Ethiopian Council of</span>
            <span className="font-black text-sm leading-none tracking-tight uppercase text-white">Gospel Believers' Churches</span>
          </div>
        </div>
        <Link 
          href="/login" 
          className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-sm font-medium transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[55vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689173/hero-bg_kjbgea.jpg" 
            alt="Background" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-slate-950/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-zinc-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Official Church Portal
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">ECGBC Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            The central hub for registering new churches, securing church names, and managing your ongoing compliance and annual reports.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 -mt-16 pb-24 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Register */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-xl shadow-black/5 border border-neutral-100 dark:border-zinc-800 flex flex-col hover:border-amber-500/50 transition-colors group">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Apply for Registration</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 flex-1 text-sm leading-relaxed">
              Start the official registration process. Provide your church details, required documents, and up to 5 proposed names in one seamless flow.
            </p>
            <Link href="/apply" className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors">
              Start Application <ArrowRight size={18} />
            </Link>
          </div>

          {/* Card 2: Reserve Name */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-xl shadow-black/5 border border-neutral-100 dark:border-zinc-800 flex flex-col hover:border-blue-500/50 transition-colors group">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Hash size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Reserve a Name</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 flex-1 text-sm leading-relaxed">
              Not ready to fully register yet? Secure a unique name for your church or fellowship in advance to prevent others from using it.
            </p>
            <Link href="/reserve-name" className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium transition-colors">
              Check Availability <ArrowRight size={18} />
            </Link>
          </div>

          {/* Card 3: Login */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-xl shadow-black/5 border border-neutral-100 dark:border-zinc-800 flex flex-col hover:border-slate-500/50 transition-colors group">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LogIn size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Church Dashboard</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 flex-1 text-sm leading-relaxed">
              Already a registered member? Sign in to submit your annual reports, manage documents, and update your contact information.
            </p>
            <Link href="/login" className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium transition-colors">
              Sign In <ArrowRight size={18} />
            </Link>
          </div>

        </div>
      </div>
      
      <footer className="text-center pb-8 text-sm text-neutral-500 dark:text-neutral-600">
        &copy; {new Date().getFullYear()} Ethiopian Council of Gospel Believers' Churches. All rights reserved.
      </footer>
    </div>
  );
}
