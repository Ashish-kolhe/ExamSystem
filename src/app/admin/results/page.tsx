"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  GraduationCap, 
  Search, 
  Activity,
  Calendar,
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  X,
  Filter,
  MoreHorizontal,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showAllStats, setShowAllStats] = useState(false);
  const [showAllParticipation, setShowAllParticipation] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: resultsData, error: resultsError } = await supabase
        .from("results")
        .select(`
          *,
          profiles (first_name, father_name, surname, email),
          exams (
            id,
            title,
            course_id,
            courses (name)
          )
        `)
        .order("completed_at", { ascending: false });

      if (resultsError) throw resultsError;

      const { data: examsData } = await supabase.from("exams").select("id, title, course_id, course_ids, created_at");
      const { data: coursesData } = await supabase.from("courses").select("id, name");
      const { data: enrollmentsData } = await supabase.from("student_enrollments").select("student_id, course_id");

      setResults(resultsData || []);
      setExams(examsData || []);
      setCourses(coursesData || []);
      setEnrollments(enrollmentsData || []);
    } catch (error: any) {
      toast.error("Failed to fetch results: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, courseFilter, examFilter, statusFilter]);

  const handleViewDetails = async (result: any) => {
    let answers = result.answers;
    if (typeof answers === "string") {
      try {
        answers = JSON.parse(answers);
      } catch (e) {
        answers = {};
      }
    }
    
    const updatedResult = { ...result, answers };
    setSelectedResult(updatedResult);
    setIsDetailOpen(true);
    setLoadingDetails(true);

    try {
      const questionIds = answers ? Object.keys(answers) : [];
      if (questionIds.length === 0) {
        setExamQuestions([]);
        return;
      }

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .in("id", questionIds);
      
      if (error) throw error;
      setExamQuestions(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch exam details: " + error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const studentName = `${result.profiles?.first_name} ${result.profiles?.father_name} ${result.profiles?.surname}`.toLowerCase();
      const examTitle = result.exams?.title?.toLowerCase() || "";
      
      const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || 
                            examTitle.includes(searchQuery.toLowerCase());
      
      const matchesCourse = courseFilter === "all" || 
                           result.exams?.course_id === courseFilter || 
                           (result.exams?.course_ids && result.exams.course_ids.includes(courseFilter));
      
    const matchesExam = examFilter === "all" || result.exam_id === examFilter;
    
    const percentage = (result.score / result.total) * 100;
    const isPassed = percentage >= 40;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "passed" && isPassed) || 
                         (statusFilter === "failed" && !isPassed);
    
    return matchesSearch && matchesCourse && matchesExam && matchesStatus;
  });
}, [results, searchQuery, courseFilter, examFilter, statusFilter]);

const { paginatedResults, totalPages } = useMemo(() => {
  const total = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredResults.slice(start, start + ITEMS_PER_PAGE);
  return { paginatedResults: paginated, totalPages: total };
}, [filteredResults, currentPage]);

  const stats = useMemo(() => {
    const totalCount = exams.length;
    
    // Total participation: unique students who took at least one exam
    const totalParticipation = new Set(results.map(r => r.student_id)).size;
    const totalEnrollments = new Set(enrollments.map(e => e.student_id)).size;
    
    const courseStats = courses.map(course => {
      // Check both course_id and course_ids array
      const examsInCourse = exams.filter(e => 
        e.course_id === course.id || 
        (e.course_ids && Array.isArray(e.course_ids) && e.course_ids.includes(course.id))
      );
      
      const examsCount = examsInCourse.length;
      
      // Get the most recent exam creation date for this course
      const latestExamDate = examsCount > 0 
        ? Math.max(...examsInCourse.map(e => new Date(e.created_at || 0).getTime()))
        : 0;
      
      // Students enrolled in this course
      const enrolledCount = enrollments.filter(e => e.course_id === course.id).length;
      
      // Unique students who took at least one exam in this course
      const tookExamCount = new Set(
        results
          .filter(r => 
            r.exams?.course_id === course.id || 
            (r.exams?.course_ids && r.exams.course_ids.includes(course.id))
          )
          .map(r => r.student_id)
      ).size;

      return {
        id: course.id,
        name: course.name,
        examsCount,
        latestExamDate,
        enrolledCount,
        tookExamCount
      };
    }).sort((a, b) => b.latestExamDate - a.latestExamDate); // Sort by most recent exam first

    return { totalCount, totalParticipation, totalEnrollments, courseStats };
  }, [results, exams, courses, enrollments]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900">Analytics Hub</h1>
          <p className="text-xs md:text-sm text-zinc-500">Track student performance and assessment trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="h-9 md:h-10 rounded-lg px-3 md:px-4 border-zinc-200 bg-white text-[10px] md:text-xs font-semibold"
          >
            <RefreshCw className={cn("h-3 w-3 md:h-3.5 md:w-3.5 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="space-y-4 px-4 md:px-0">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">General Overview</h2>
          {stats.courseStats.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllStats(!showAllStats)}
              className="h-6 text-[10px] font-bold text-zinc-500 hover:text-zinc-900"
            >
              {showAllStats ? "Show Less" : "View All"}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-none shadow-sm bg-white ring-1 ring-zinc-100 rounded-xl md:rounded-2xl overflow-hidden">
            <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate">Total Exams</p>
                <p className="text-base md:text-lg font-bold text-zinc-900">{stats.totalCount}</p>
              </div>
            </CardContent>
          </Card>
          
          {(showAllStats ? stats.courseStats : stats.courseStats.slice(0, 3)).map((cs, i) => (
            <Card key={i} className="border-none shadow-sm bg-white ring-1 ring-zinc-100 rounded-xl md:rounded-2xl overflow-hidden">
              <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 bg-zinc-50">
                  <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-zinc-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate">{cs.name}</p>
                  <p className="text-sm md:text-base font-bold text-zinc-900 truncate leading-tight">{cs.examsCount} Exams</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Participation Grid */}
      <div className="space-y-4 px-4 md:px-0">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Participation Analytics</h2>
          {stats.courseStats.length > 4 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllParticipation(!showAllParticipation)}
              className="h-6 text-[10px] font-bold text-zinc-500 hover:text-zinc-900"
            >
              {showAllParticipation ? "Show Less" : "View All"}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-white ring-1 ring-zinc-100 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[9px] font-bold uppercase px-2 py-0.5 border-none">
                  All Courses
                </Badge>
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-black text-zinc-900">
                  {stats.totalParticipation} <span className="text-sm font-medium text-zinc-400">/ {stats.totalEnrollments}</span>
                </p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Total Student Participation</p>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-5 w-5 rounded-full bg-zinc-100 ring-2 ring-white border border-zinc-200 shrink-0" />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 ml-2">
                  {stats.totalEnrollments > 0 ? Math.round((stats.totalParticipation / stats.totalEnrollments) * 100) : 0}% Rate
                </span>
              </div>
            </CardContent>
          </Card>

          {(showAllParticipation ? stats.courseStats : stats.courseStats.slice(0, 3)).map((cs, i) => (
            <Card key={i} className="border-none shadow-sm bg-white ring-1 ring-zinc-100 rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 text-[9px] font-bold uppercase px-2 py-0.5 border-none truncate max-w-[120px]">
                    {cs.name}
                  </Badge>
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-black text-zinc-900">
                    {cs.tookExamCount} <span className="text-sm font-medium text-zinc-400">/ {cs.enrolledCount}</span>
                  </p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Students Participated</p>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="h-5 w-5 rounded-full bg-zinc-100 ring-2 ring-white border border-zinc-200 shrink-0" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 ml-2">
                    {cs.enrolledCount > 0 ? Math.round((cs.tookExamCount / cs.enrolledCount) * 100) : 0}% Rate
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mx-4 md:mx-0 flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-2 md:p-3 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input 
            placeholder="Search student or module..." 
            className="h-9 md:h-10 pl-10 rounded-xl border-none bg-zinc-50/50 focus:bg-white transition-all text-[11px] md:text-sm w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-9 md:h-10 min-w-[120px] md:w-[140px] rounded-xl border-zinc-100 bg-zinc-50/50 text-[10px] md:text-xs font-semibold">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-3 w-3 opacity-40 shrink-0" />
                  <SelectValue placeholder="Course" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="h-9 md:h-10 min-w-[120px] md:w-[160px] rounded-xl border-zinc-100 bg-zinc-50/50 text-[10px] md:text-xs font-semibold">
                <SelectValue placeholder="Assessment" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                <SelectItem value="all">All Assessments</SelectItem>
                {exams
                  .filter(e => courseFilter === "all" || e.course_id === courseFilter)
                  .map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 md:h-10 min-w-[100px] md:w-[110px] rounded-xl border-zinc-100 bg-zinc-50/50 text-[10px] md:text-xs font-semibold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed" className="text-emerald-600">Passed</SelectItem>
                <SelectItem value="failed" className="text-red-600">Failed</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

        {/* Results List */}
        <div className="mx-4 md:mx-0 bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-20" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-20 text-center space-y-2">
              <Search className="h-10 w-10 text-zinc-200 mx-auto" />
              <p className="text-sm font-semibold text-zinc-900">No results found</p>
              <p className="text-xs text-zinc-500">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block md:hidden divide-y divide-zinc-100">
                {paginatedResults.map((result) => {
                  const percentage = Math.round((result.score / result.total) * 100);
                  const isPassed = percentage >= 40;
                  return (
                    <div key={result.id} className="p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                            {result.profiles?.first_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-900 leading-none truncate">
                              {result.profiles?.first_name} {result.profiles?.surname}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1 truncate">{result.exams?.title}</p>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-bold px-2 py-0 border-none shrink-0 ml-2",
                          isPassed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {percentage}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                        <span className="text-[10px] font-medium text-zinc-400">
                          {new Date(result.completed_at).toLocaleDateString()}
                        </span>
                        <Button 
                          onClick={() => handleViewDetails(result)}
                          variant="ghost" 
                          size="sm"
                          className="h-8 text-xs font-bold text-zinc-600 px-0 hover:bg-transparent"
                        >
                          View Details
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Student</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden md:table-cell">Assessment</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Score</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden lg:table-cell">Completed</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paginatedResults.map((result) => {
                      const percentage = Math.round((result.score / result.total) * 100);
                      const isPassed = percentage >= 40;
                      
                      return (
                        <tr key={result.id} className="group hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                                {result.profiles?.first_name?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-zinc-900 truncate">
                                  {result.profiles?.first_name} {result.profiles?.surname}
                                </p>
                                <p className="text-[10px] text-zinc-400 truncate hidden sm:block">
                                  {result.profiles?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-zinc-900 line-clamp-1">{result.exams?.title}</p>
                              <Badge variant="secondary" className="bg-zinc-100 text-[9px] font-bold uppercase border-none px-1.5 py-0">
                                {result.exams?.courses?.name || "N/A"}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-bold",
                                isPassed ? "text-emerald-600" : "text-red-600"
                              )}>
                                {percentage}%
                              </span>
                              <span className="text-[10px] text-zinc-400">({result.score}/{result.total})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <div className="flex flex-col text-[10px] text-zinc-500">
                              <span className="font-semibold">{new Date(result.completed_at).toLocaleDateString()}</span>
                              <span>{new Date(result.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              onClick={() => handleViewDetails(result)}
                              variant="ghost" 
                              size="sm"
                              className="h-8 rounded-lg px-3 text-xs font-bold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 group-hover:bg-zinc-200"
                            >
                              Details
                              <ChevronRight className="ml-1.5 h-3 w-3 opacity-40 group-hover:translate-x-0.5 transition-all" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination UI */}
              <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Page {currentPage} of {totalPages || 1}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-8 rounded-lg border-zinc-200 text-[10px] font-bold uppercase tracking-wider"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="h-8 rounded-lg border-zinc-200 text-[10px] font-bold uppercase tracking-wider"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-l border-zinc-100 bg-white">
          <SheetHeader className="p-8 border-b border-zinc-50 relative shrink-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{selectedResult?.profiles?.first_name} {selectedResult?.profiles?.surname}</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">{selectedResult?.exams?.title}</p>
                </div>
                <Badge className={cn(
                  "font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border-none shadow-none",
                  (selectedResult?.score / selectedResult?.total) >= 0.4 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "bg-red-50 text-red-600"
                )}>
                  {(selectedResult?.score / selectedResult?.total) >= 0.4 ? "Passed" : "Failed"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Score</p>
                  <p className="text-2xl font-black text-zinc-900">{selectedResult?.score} <span className="text-sm font-medium text-zinc-300">/ {selectedResult?.total}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Accuracy</p>
                  <p className="text-2xl font-black text-zinc-900">{Math.round((selectedResult?.score / selectedResult?.total) * 100)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Completed</p>
                  <p className="text-sm font-bold text-zinc-600 pt-1">{selectedResult && new Date(selectedResult.completed_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Response Analysis</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Correct
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Wrong
                </div>
              </div>
            </div>

            {loadingDetails ? (
              <div className="py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-200" />
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(selectedResult?.answers || {}).map(([questionId, selectedOption]: [string, any], idx: number) => {
                  const question = examQuestions.find(q => q.id === questionId);
                  if (!question) return null;
                  const isCorrect = String(selectedOption) === String(question.correct_answer);
                  
                  return (
                    <div key={idx} className="flex gap-4 group">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border",
                        isCorrect 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                          : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-3 pb-6 border-b border-zinc-50 last:border-0">
                          <p className="text-sm font-semibold text-zinc-900 leading-relaxed line-clamp-3">{question.text}</p>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-100">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">SELECTED:</span>
                              <span className={cn(
                                "text-[10px] font-bold",
                                isCorrect ? "text-emerald-600" : "text-red-600"
                              )}>{selectedOption}</span>
                            </div>
                          {!isCorrect && (
                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50/50 border border-emerald-100">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">Correct:</span>
                              <span className="text-[10px] font-bold text-emerald-600">{question.correct_answer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-zinc-100 bg-zinc-50/30">
            <Button 
              onClick={() => setIsDetailOpen(false)}
              className="w-full h-11 rounded-xl bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 text-xs font-bold shadow-sm"
            >
              Close Assessment
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
