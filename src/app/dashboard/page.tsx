"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  LayoutDashboard,
  Loader2,
  ChevronRight,
  Brain
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [
        { data: profileData },
        { data: enrollData },
        { data: resultsData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("student_enrollments").select("*, courses(name), batches(name)").eq("student_id", session.user.id),
        supabase.from("results").select("*, exams(*)").eq("student_id", session.user.id).order("completed_at", { ascending: false }),
      ]);

      setUserProfile(profileData);
      setEnrollments(enrollData || []);
      setResults(resultsData || []);

      if (enrollData && enrollData.length > 0) {
        const courseIds = Array.from(new Set(enrollData.map(e => e.course_id)));
        const batchIds = Array.from(new Set(enrollData.map(e => e.batch_id).filter(id => id !== null)));

        let query = supabase
          .from("exams")
          .select("*, courses(name), batches(name)");
        
        const orConditions = [];
        if (courseIds.length > 0) {
          orConditions.push(`course_id.in.(${courseIds.join(",")})`);
          orConditions.push(`course_ids.ov.{${courseIds.join(",")}}`);
        }
        if (batchIds.length > 0) orConditions.push(`batch_id.in.(${batchIds.join(",")})`);
        
        if (orConditions.length > 0) {
          query = query.or(orConditions.join(","));
        }

        const { data: examsData } = await query;
        setExams(examsData || []);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const stats = {
    totalExams: results.length,
    avgScore: results.length > 0 ? Math.round(results.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / results.length * 100) : 0,
    passedExams: results.filter(r => (r.score / r.total) >= 0.4).length,
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 text-sm">Welcome back, {userProfile?.first_name}.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-lg border text-xs font-medium text-zinc-600">
          <BookOpen className="h-4 w-4 text-primary" />
          {enrollments.length} Active Courses
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { name: "Exams Attempted", value: stats.totalExams, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50/50" },
          { name: "Avg Performance", value: `${stats.avgScore}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50/50" },
          { name: "Success Rate", value: stats.passedExams, icon: Award, color: "text-amber-600", bg: "bg-amber-50/50" }
        ].map((stat) => (
          <Card key={stat.name} className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">{stat.name}</p>
                  <h3 className="text-2xl font-bold text-zinc-900">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-12">
        {/* Available Exams */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Assigned Exams</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exams.length === 0 ? (
              <Card className="col-span-full border shadow-sm py-12 flex flex-col items-center justify-center text-center">
                <ClipboardList className="h-8 w-8 text-zinc-200 mb-2" />
                <p className="text-sm font-medium text-zinc-500">No exams assigned yet.</p>
              </Card>
            ) : (
              exams.map((exam) => {
                const isTaken = results.some(r => r.exam_id === exam.id);
                return (
                  <Card key={exam.id} className={cn(
                    "border shadow-sm overflow-hidden flex flex-col",
                    isTaken && "bg-zinc-50/50"
                  )}>
                    <CardHeader className="p-5 pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold border-zinc-200 bg-white">
                          {exam.courses?.name || "Course"}
                        </Badge>
                        {isTaken && (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 text-[10px] uppercase font-semibold">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-bold mt-2 leading-tight">{exam.title}</CardTitle>
                      <CardDescription className="text-[10px] font-medium uppercase text-zinc-400">
                        {exam.batches?.name || "Standard Batch"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-2 flex-grow">
                      <div className="flex items-center gap-4 text-[10px] font-semibold text-zinc-500 uppercase">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {exam.duration} Min
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(exam.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-5 pt-0">
                      {isTaken ? (
                        <Button variant="outline" disabled className="w-full h-10 text-xs font-bold border-zinc-200">
                          Already Completed
                        </Button>
                      ) : (
                        <Link href={`/exam/${exam.id}`} className="w-full">
                          <Button className="w-full h-10 text-xs font-bold">
                            Start Exam
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="xl:col-span-4 space-y-4">
          <h2 className="text-lg font-bold">Recent Outcomes</h2>
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {results.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="h-8 w-8 text-zinc-200 mb-2" />
                  <p className="text-sm font-medium text-zinc-500">No results recorded.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {results.slice(0, 5).map((res) => {
                    const percentage = Math.round((res.score / res.total) * 100);
                    const isPassed = percentage >= 40;
                    return (
                      <div key={res.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                        <div className="min-w-0 flex-grow mr-4">
                          <p className="text-sm font-bold text-zinc-900 truncate">{res.exams?.title}</p>
                          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-tight">
                            {new Date(res.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-bold text-zinc-900">{res.score}/{res.total}</span>
                          <Badge className={cn(
                            "text-[8px] font-bold uppercase px-1.5 py-0 border-none",
                            isPassed ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50" : "bg-red-50 text-red-600 hover:bg-red-50"
                          )}>
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {results.length > 0 && (
                <div className="p-4 border-t bg-zinc-50/50">
                  <Button variant="ghost" className="w-full h-8 text-xs font-bold text-zinc-500 hover:text-primary">
                    View History
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
         
        </div>
      </div>
    </div>
  );
}
