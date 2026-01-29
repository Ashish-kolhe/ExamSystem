"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BookOpen, 
  Users, 
  FileQuestion, 
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  LayoutDashboard,
  TrendingUp,
  Activity,
  History,
  ChevronDown,
  X,
  Target,
  Trophy,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    questions: 0,
    exams: 0,
    results: 0,
    avgScore: 0,
    passRate: 0
  });
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: courses },
        { count: students },
        { count: questions },
        { count: exams },
        { count: resultsCount },
        { data: allResults },
        { data: recentRes }
      ] = await Promise.all([
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("exams").select("*", { count: "exact", head: true }),
        supabase.from("results").select("*", { count: "exact", head: true }),
        supabase.from("results").select("score, total"),
        supabase.from("results")
          .select("*, profiles (first_name, surname), exams (title)")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      const avg = allResults && allResults.length > 0 
        ? Math.round((allResults.reduce((acc, r) => acc + (r.score / r.total), 0) / allResults.length) * 100)
        : 0;
      
      const passCount = allResults ? allResults.filter(r => (r.score / r.total) >= 0.4).length : 0;
      const rate = allResults && allResults.length > 0 ? Math.round((passCount / allResults.length) * 100) : 0;

      setStats({
        courses: courses || 0,
        students: students || 0,
        questions: questions || 0,
        exams: exams || 0,
        results: resultsCount || 0,
        avgScore: avg,
        passRate: rate
      });
      setRecentResults(recentRes || []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { name: "Courses", value: stats.courses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100", href: "/admin/courses" },
    { name: "Students", value: stats.students, icon: Users, color: "text-purple-600", bg: "bg-purple-50/50", border: "border-purple-100", href: "/admin/students" },
    { name: "Questions", value: stats.questions, icon: FileQuestion, color: "text-amber-600", bg: "bg-amber-50/50", border: "border-amber-100", href: "/admin/questions" },
    { name: "Exams", value: stats.exams, icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100", href: "/admin/exams" },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 text-sm">Welcome back to the admin portal.</p>
        </div>
        <div className="flex items-center gap-3">
         
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="border shadow-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">{stat.name}</p>
                    <h3 className="text-2xl font-bold text-zinc-900">
                      {loading ? <span className="animate-pulse opacity-20">...</span> : stat.value}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-12">
        {/* Quick Actions */}
        <Card className="xl:col-span-8 border shadow-sm">
          <CardHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                <CardDescription className="text-xs">Common administrative tasks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Manage Exams", icon: ClipboardList, href: "/admin/exams", variant: "primary" },
                { label: "Add Question", icon: FileQuestion, href: "/admin/questions", variant: "outline" },
                { label: "Enroll Students", icon: Users, href: "/admin/students", variant: "outline" },
                { label: "Courses", icon: BookOpen, href: "/admin/courses", variant: "outline" },
                { label: "Batch Control", icon: Activity, href: "/admin/batches", variant: "outline" },
                { label: "Results", icon: TrendingUp, href: "/admin/results", variant: "outline" },
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <div className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary/30 hover:bg-zinc-50/50 transition-all">
                    <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{action.label}</h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="xl:col-span-4 border shadow-sm">
          <CardHeader className="p-6 border-b">
            <div>
              <CardTitle className="text-lg font-bold">Recent Results</CardTitle>
              <CardDescription className="text-xs">Latest exam completions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-12 bg-zinc-50 rounded-lg animate-pulse" />
                ))
              ) : recentResults.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">No recent completions.</p>
              ) : (
                recentResults.map((result, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-600">
                        {Math.round((result.score / result.total) * 100)}%
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {result.profiles?.first_name} {result.profiles?.surname}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate uppercase tracking-wider">
                          {result.exams?.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link href="/admin/results" className="block mt-6">
              <Button variant="outline" size="sm" className="w-full">
                View All Results
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
