"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileQuestion, 
  ClipboardList, 
  GraduationCap,
    LogOut,
    ChevronRight,
    Layers
  } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import Image from "next/image";

const menuItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
    { name: "Batches", href: "/admin/batches", icon: Layers },
  { name: "Questions", href: "/admin/questions", icon: FileQuestion },
  { name: "Exams", href: "/admin/exams", icon: ClipboardList },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Results", href: "/admin/results", icon: GraduationCap },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Skip check for login page
      if (pathname === "/admin/login") {
        setLoading(false);
        return;
      }

      const checkAdmin = async () => {
          try {
            setLoading(true);
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
              router.push("/admin/login");
              setLoading(false);
              return;
            }

            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .single();

            if (profileError || profile?.role !== "admin") {
              console.error("Admin check failed:", profileError || "Not an admin");
              router.push("/dashboard");
              setLoading(false);
              return;
            }
            
            setLoading(false);
          } catch (err) {
            console.error("Auth check error:", err);
            router.push("/admin/login");
            setLoading(false);
          }
        };

        checkAdmin();
      }, [pathname, router]);


    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push("/admin/login");
    };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white text-primary">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If it's the login page, just render the children without the dashboard layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans selection:bg-primary selection:text-white">
    {/* Sidebar - Desktop */}
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-zinc-200 bg-white lg:block">
        <div className="flex h-20 items-center border-b border-zinc-100 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="rounded-full bg-white p-0.5 ring-1 ring-zinc-200 shadow-sm">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-zinc-900 leading-none">ADMIN HUB</span>
              <span className="text-[9px] font-black tracking-[0.2em] text-zinc-400 uppercase">Shree Genius</span>
            </div>
          </Link>
        </div>
        <nav className="flex flex-col gap-1.5 p-4 mt-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all",
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-zinc-400")} />
                    {item.name}
                  </div>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 w-full border-t border-zinc-100 p-4 bg-zinc-50/50">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:bg-red-50 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Nav Toggle */}
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button 
            className="h-14 w-14 rounded-full bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center p-0"
            onClick={() => {
              const menu = document.getElementById("mobile-admin-menu");
              if (menu) menu.classList.toggle("hidden");
            }}
          >
            <LayoutDashboard className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          id="mobile-admin-menu" 
          className="fixed inset-0 z-[100] hidden bg-white/95 backdrop-blur-md lg:hidden animate-in fade-in duration-300"
        >
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full" />
                <span className="text-xl font-black tracking-tighter">ADMIN <span className="text-primary">HUB</span></span>
              </div>
              <Button 
                variant="ghost" 
                className="rounded-full h-12 w-12 p-0"
                onClick={() => {
                  const menu = document.getElementById("mobile-admin-menu");
                  if (menu) menu.classList.add("hidden");
                }}
              >
                <ChevronRight className="h-6 w-6 rotate-180" />
              </Button>
            </div>
            <nav className="flex flex-col gap-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      const menu = document.getElementById("mobile-admin-menu");
                      if (menu) menu.classList.add("hidden");
                    }}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest transition-all",
                      isActive 
                        ? "bg-primary text-white shadow-xl shadow-primary/20" 
                        : "text-zinc-500 border border-zinc-100"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-zinc-400")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto pt-8 border-t border-zinc-100">
              <Button 
                variant="ghost" 
                className="w-full h-16 justify-between rounded-2xl text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-50"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-4">
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </div>
                <ChevronRight className="h-5 w-5 opacity-40" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:pl-64">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-zinc-200 bg-white/80 px-8 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <h1 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Platform / <span className="text-zinc-900">{pathname.split("/").pop() || "Overview"}</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end mr-1">
                <span className="text-xs font-black text-zinc-900 uppercase tracking-tight">System Admin</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Session</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-white p-0.5 ring-1 ring-zinc-200 shadow-sm overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full object-cover" />
              </div>
            </div>
          </header>
        <main className="p-4 md:p-8 w-full max-w-[1920px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
