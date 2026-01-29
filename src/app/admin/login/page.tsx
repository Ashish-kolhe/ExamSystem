"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email = username === "admin" ? "admin@geniusit.com" : username;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Unauthorized access. Admin only.");
      }

      toast.success("Admin access granted");
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50/50 selection:bg-primary selection:text-white items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Home
          </Link>
          
            <div className="flex flex-col items-center gap-4">
              <div className="p-0.5 bg-white rounded-full ring-1 ring-zinc-200 shadow-sm">
                <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-full" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Admin Login</h1>
                <p className="text-sm text-zinc-500 font-medium">Administrative Access Only</p>
              </div>
            </div>
        </div>

        <Card className="border border-zinc-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-0.5">
                  Admin Username
                </Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 rounded-xl border-zinc-200 focus:border-primary/30 focus:ring-primary/5 transition-all bg-zinc-50/30"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-0.5">
                  Master Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-zinc-200 focus:border-primary/30 focus:ring-primary/5 transition-all bg-zinc-50/30"
                  required
                />
              </div>

              <Button 
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 transition-all text-sm font-bold shadow-sm mt-2" 
                type="submit" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-8 pt-0 text-center">
            <div className="relative w-full py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-4 text-zinc-300">Not an Admin?</span>
              </div>
            </div>
            
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full h-12 rounded-xl border border-zinc-100 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all">
                Student Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
