"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  GraduationCap,
  LogOut,
  User,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import Image from "next/image";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        router.push("/login");
        return;
      }

      setProfile(profile);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="rounded-full bg-white p-0.5 ring-1 ring-zinc-200 shadow-sm">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-zinc-900 leading-none">SHREE GENIUS</span>
              <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">IT HUB</span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-black text-zinc-900 tracking-tight uppercase">{profile?.first_name} {profile?.surname}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Student Portal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shadow-sm">
                <User className="h-5 w-5 text-zinc-600" />
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase">
          © 2026 SHREE GENIUS IT HUB. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
