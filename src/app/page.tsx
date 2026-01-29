"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Clock, 
  Users, 
  BookOpen,
  ClipboardList,
  Menu,
  X,
  User,
  ShieldCheck
} from "lucide-react";

import Image from "next/image";

export default function LandingPage() {
  const [ongoingExams, setOngoingExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchOngoing = async () => {
      const { data } = await supabase
        .from("exams")
        .select("*, courses(name)")
        .limit(3)
        .order("created_at", { ascending: false });
      setOngoingExams(data || []);
      setLoading(false);
    };
    fetchOngoing();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-zinc-900 selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-[130] w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-[140]">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-0.5 ring-1 ring-zinc-200 shadow-sm">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter uppercase">SHREE GENIUS <span className="text-primary">IT HUB</span></span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-xs font-bold px-5 h-10 tracking-wider flex items-center gap-2 rounded-full border border-zinc-100 hover:bg-zinc-50">
                <div className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center">
                  <User className="h-3 w-3 text-zinc-600" />
                </div>
                STUDENT
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button className="text-xs font-bold bg-transparent hover:bg-primary/10 px-5 h-10 tracking-wider text-primary  flex items-center gap-2 rounded-full ">
                <div className="h-5 w-5 rounded-full bg-transparent flex items-center justify-center overflow-hidden">
                  <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-full" />
                </div>
                ADMIN
              </Button>
            </Link>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden p-2 text-zinc-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[110] bg-white pt-24 px-6 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full h-14 text-sm font-bold justify-between px-6 border border-zinc-100 rounded-xl bg-zinc-50/50">
                STUDENT LOGIN
                <ArrowRight className="h-4 w-4 opacity-40" />
              </Button>
            </Link>
            <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full h-14 text-sm font-bold bg-primary hover:bg-primary/90 justify-between px-6 rounded-xl text-white">
                ADMIN LOGIN
                <ArrowRight className="h-4 w-4 opacity-40" />
              </Button>
            </Link>
          </div>
        )}
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-20 md:pt-40 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              Next-Gen Assessment Platform
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-zinc-900 leading-[1.1] md:leading-[1.05]">
              Master your skills with <span className="text-primary">precision.</span>
            </h1>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed font-medium">
              The professional examination platform for Shree Genius IT Hub. 
              Clean, secure, and focused on your progress.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-sm font-bold rounded-full bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all uppercase tracking-wider">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Ongoing Exams Section */}
        <section className="py-20 md:py-32 border-t border-zinc-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-24">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase">Active Exams</h2>
                <p className="text-zinc-500 font-medium text-base md:text-lg">Recent assessments available for students.</p>
              </div>
              <Link href="/login" className="text-primary font-bold flex items-center hover:opacity-80 transition-opacity text-xs uppercase tracking-widest">
                All Available Exams
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-80 rounded-3xl bg-zinc-50 animate-pulse" />
                ))
              ) : ongoingExams.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <ClipboardList className="h-12 w-12 text-zinc-300 mx-auto mb-6" />
                  <p className="text-zinc-900 font-bold text-xl tracking-tight">No active exams right now.</p>
                  <p className="text-zinc-400 text-sm mt-2">Check back later for updates.</p>
                </div>
              ) : (
                ongoingExams.map((exam) => (
                  <div key={exam.id} className="group bg-white p-10 rounded-3xl border border-zinc-100 hover:border-primary/20 hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-8">
                      <div className="p-4 bg-zinc-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
                        <BookOpen className="h-6 w-6 text-zinc-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                        Live
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-tight leading-tight">{exam.title}</h3>
                      <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mb-8">
                        {exam.courses?.name || "General Course"}
                      </p>
                    </div>
                    <div className="space-y-6 pt-6 border-t border-zinc-50">
                      <div className="flex items-center gap-6 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 opacity-50" />
                          {exam.duration}M
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 opacity-50" />
                          Batches
                        </div>
                      </div>
                      <Link href="/login" className="block">
                        <Button className="w-full h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-zinc-900 hover:bg-primary transition-all text-white">
                          TAKE ASSESSMENT
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary rounded-[32px] p-12 md:p-24 text-center text-white relative overflow-hidden">
              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase">Start Today.</h2>
                <p className="text-white/80 text-base md:text-lg max-w-xl mx-auto">Join the Elite students at Shree Genius IT Hub and validate your expertise with industry standard assessments.</p>
                <div className="pt-4">
                  <Link href="/register">
                    <Button size="lg" className="h-14 px-10 bg-white text-primary hover:bg-zinc-100 rounded-full font-bold text-sm tracking-widest uppercase">
                      Register Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white py-12 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3 transition-all cursor-default">
              <Image src="/logo.png" alt="Logo" width={24} height={24} className="rounded-full" />
              <span className="text-xs font-black tracking-tighter uppercase text-zinc-900">SHREE GENIUS <span className="text-primary">IT HUB</span></span>
            </div>
          
          <nav className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <Link href="/login" className="hover:text-primary transition-colors">Student</Link>
            <Link href="/register" className="hover:text-primary transition-colors">Register</Link>
            <Link href="/admin/login" className="hover:text-primary transition-colors">Admin</Link>
          </nav>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
            © 2026 SGIH.
          </p>
        </div>
      </footer>
    </div>
  );
}
