"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Clock, 
  FileQuestion,
  Search,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
  Shuffle,
  Save,
    ClipboardList,
    Share2
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [batchId, setBatchId] = useState("all");
  const [duration, setDuration] = useState("60");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRandomized, setIsRandomized] = useState(true);
  const [easyCount, setEasyCount] = useState("0");
  const [moderateCount, setModerateCount] = useState("0");
  const [hardCount, setHardCount] = useState("0");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [modalQuestionSearch, setModalQuestionSearch] = useState("");

  const formRef = useRef<HTMLDivElement>(null);
  const scrollRequestRef = useRef<boolean>(false);

  useEffect(() => {
    if (isFormOpen && scrollRequestRef.current && formRef.current) {
      const timer = setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        scrollRequestRef.current = false;
      }, 300); 
      return () => clearTimeout(timer);
    }
  }, [isFormOpen, editingId]);

  const resetFormFields = useCallback(() => {
    setEditingId(null);
    setTitle("");
    setCourseIds([]);
    setBatchId("all");
    setDuration("60");
    setStartTime("");
    setEndTime("");
    setIsShuffled(false);
    setIsRandomized(true);
    setEasyCount("0");
    setModerateCount("0");
    setHardCount("0");
    setSelectedQuestions([]);
    setModalQuestionSearch("");
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    resetFormFields();
  }, [resetFormFields]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: examsData },
        { data: coursesData },
        { data: batchesData },
        { data: questionsData }
      ] = await Promise.all([
        supabase.from("exams").select("*, courses(name), batches(name)").order("created_at", { ascending: false }),
        supabase.from("courses").select("*").order("name"),
        supabase.from("batches").select("*").order("name"),
        supabase.from("questions").select("*, courses(name)").order("created_at", { ascending: false })
      ]);
      
      setExams(examsData || []);
      setCourses(coursesData || []);
      setBatches(batchesData || []);
      setQuestions(questionsData || []);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = useCallback(async (exam: any) => {
    try {
      const { data: eq } = await supabase.from("exam_questions").select("question_id").eq("exam_id", exam.id);
      const questionIds = (eq?.map(q => q.question_id.toString()) || []) as string[];
      
      const rawCourseIds = exam.course_ids || (exam.course_id ? [exam.course_id] : []);
      
      setTitle(exam.title || "");
      setCourseIds(rawCourseIds.map((id: any) => id.toString()));
      setBatchId(exam.batch_id?.toString() || "all");
      setDuration(exam.duration?.toString() || "60");
      setStartTime(exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : "");
      setEndTime(exam.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : "");
      setIsShuffled(!!exam.is_shuffled);
      setIsRandomized(!!exam.is_randomized);
      setEasyCount(exam.easy_count?.toString() || "0");
      setModerateCount(exam.moderate_count?.toString() || "0");
      setHardCount(exam.hard_count?.toString() || "0");
      setSelectedQuestions(questionIds);
      
      setEditingId(exam.id);
      scrollRequestRef.current = true;
      setIsFormOpen(true);
    } catch (error: any) {
      toast.error("Failed to load exam details");
    }
  }, []);

  const handleShare = useCallback((exam: any) => {
    const url = `${window.location.origin}/exam/${exam.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Assessment link copied");
  }, []);

  const handleDelete = async () => {
    if (!examToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("exams").delete().eq("id", examToDelete.id);
      if (error) throw error;
      toast.success("Assessment deleted");
      setDeleteModalOpen(false);
      setExamToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const availableQuestionCounts = useMemo(() => {
    const relevantQuestions = questions.filter(q => q.course_id && courseIds.includes(q.course_id.toString()));
    return {
      Easy: relevantQuestions.filter(q => q.difficulty === "Easy").length,
      Moderate: relevantQuestions.filter(q => q.difficulty === "Moderate").length,
      Hard: relevantQuestions.filter(q => q.difficulty === "Hard").length,
    };
  }, [questions, courseIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (courseIds.length === 0) {
      return toast.error("Select at least one program");
    }

    if (isRandomized) {
      const easy = parseInt(easyCount) || 0;
      const moderate = parseInt(moderateCount) || 0;
      const hard = parseInt(hardCount) || 0;
      if (easy === 0 && moderate === 0 && hard === 0) {
        return toast.error("Set at least one question count");
      }
      if (easy > availableQuestionCounts.Easy || moderate > availableQuestionCounts.Moderate || hard > availableQuestionCounts.Hard) {
        return toast.error("Request exceeds available questions");
      }
    } else if (selectedQuestions.length === 0) {
      return toast.error("Select at least one question");
    }

    setSubmitting(true);
    const finalBatchId = batchId === "all" ? null : batchId;
    const examData = {
      title,
      course_id: courseIds[0] || null,
      course_ids: courseIds,
      batch_id: finalBatchId,
      duration: parseInt(duration) || 60,
      start_time: startTime || null,
      end_time: endTime || null,
      is_shuffled: isShuffled,
      is_randomized: isRandomized,
      easy_count: isRandomized ? parseInt(easyCount) : 0,
      moderate_count: isRandomized ? parseInt(moderateCount) : 0,
      hard_count: isRandomized ? parseInt(hardCount) : 0
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("exams").update(examData).eq("id", editingId);
        if (error) throw error;
        
        if (!isRandomized) {
          await supabase.from("exam_questions").delete().eq("exam_id", editingId);
          if (selectedQuestions.length > 0) {
            const questionInserts = selectedQuestions.map(qId => ({ exam_id: editingId, question_id: qId }));
            await supabase.from("exam_questions").insert(questionInserts);
          }
        }
        
        toast.success("Assessment updated");
        closeForm();
      } else {
        const { data: newExam, error } = await supabase.from("exams").insert(examData).select().single();
        if (error) throw error;
        
        if (!isRandomized && selectedQuestions.length > 0) {
          const questionInserts = selectedQuestions.map(qId => ({ exam_id: newExam.id, question_id: qId }));
          await supabase.from("exam_questions").insert(questionInserts);
        }
        
        toast.success("New assessment created");
        resetFormFields();
      }
      
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleQuestion = useCallback((qId: string) => {
    setSelectedQuestions(prev => {
      const exists = prev.includes(qId);
      return exists ? prev.filter(i => i !== qId) : [...prev, qId];
    });
  }, []);

  const toggleCourse = useCallback((cId: string) => {
    setCourseIds(prev => {
      const exists = prev.includes(cId);
      return exists ? prev.filter(i => i !== cId) : [...prev, cId];
    });
  }, []);

  const filteredQuestions = useMemo(() => {
    let filtered = courseIds.length > 0 
      ? questions.filter(q => q.course_id && courseIds.includes(q.course_id.toString()))
      : questions;
    
    if (modalQuestionSearch) {
      const search = modalQuestionSearch.toLowerCase();
      filtered = filtered.filter(q => q.text?.toLowerCase().includes(search));
    }
    
    return filtered;
  }, [questions, courseIds, modalQuestionSearch]);

  const displayExams = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return exams.filter(e => {
      const matchesSearch = (e.title || "").toLowerCase().includes(search) ||
        (e.courses?.name || "").toLowerCase().includes(search);
      
      const examCourseIds = (e.course_ids || []).map((id: any) => id.toString());
      const matchesCourse = filterCourse === "all" || 
        examCourseIds.includes(filterCourse) || 
        e.course_id?.toString() === filterCourse;
      
      return matchesSearch && matchesCourse;
    });
  }, [exams, searchQuery, filterCourse]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Exam Module</h1>
          <p className="text-zinc-500 font-medium">Configure and manage student assessments.</p>
        </div>
        <Button 
          onClick={() => {
            if (isFormOpen) {
              closeForm();
            } else {
              resetFormFields();
              setIsFormOpen(true);
            }
          }}
          className={cn(
            "h-12 px-6 rounded-xl font-bold transition-all flex items-center gap-2",
            isFormOpen ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {isFormOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isFormOpen ? "Close Form" : "Create Assessment"}
        </Button>
      </div>

      {isFormOpen && (
        <div ref={formRef} className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-2 border-zinc-100 shadow-xl rounded-3xl overflow-hidden mb-12">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                {editingId ? "Update Assessment" : "New Assessment"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Assessment Title</label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      required 
                      placeholder="e.g. Final Examination 2024"
                      className="h-14 rounded-2xl border-zinc-200 bg-white px-6 font-bold text-lg focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Programs</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl border-zinc-200 bg-white justify-between px-6 font-medium hover:bg-zinc-50 transition-all">
                            <span className="truncate">
                              {courseIds.length === 0 ? "Select programs" : `${courseIds.length} Selected`}
                            </span>
                            <ChevronRight className="h-4 w-4 opacity-40" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl border-zinc-100 shadow-2xl overflow-hidden" align="start">
                          <div className="p-3 border-b border-zinc-100 bg-zinc-50/50">
                            <Input 
                              placeholder="Search programs..." 
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                              className="h-9 rounded-xl border-zinc-200 bg-white font-bold text-[10px]"
                            />
                          </div>
                          <div className="h-60 overflow-auto p-2">
                            {courses.filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase())).map(c => {
                              const cIdStr = c.id.toString();
                              const isChecked = courseIds.includes(cIdStr);
                              return (
                                <div 
                                  key={cIdStr} 
                                  className={cn("flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors", isChecked ? "bg-primary/5 text-primary" : "hover:bg-zinc-50")} 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleCourse(cIdStr);
                                  }}
                                >
                                  <div className={cn("h-4 w-4 rounded border flex items-center justify-center transition-colors", isChecked ? "bg-primary border-primary" : "border-zinc-300 bg-white")}>
                                    {isChecked && <div className="h-2 w-2 bg-white rounded-full" />}
                                  </div>
                                  <span className="font-bold text-xs">{c.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Duration (Mins)</label>
                      <Input 
                        type="number" 
                        value={duration} 
                        onChange={(e) => setDuration(e.target.value)} 
                        required 
                        className="h-14 rounded-2xl border-zinc-200 bg-white px-6 font-medium focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Target Batch</label>
                      <select 
                        value={batchId} 
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full h-14 rounded-2xl border-2 border-zinc-200 bg-white px-6 font-bold text-sm focus:border-primary focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.2rem' }}
                      >
                        <option value="all">Global (All Batches)</option>
                        {batches.map(b => (
                          <option key={b.id.toString()} value={b.id.toString()}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Start Time (Optional)</label>
                      <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-14 rounded-2xl border-zinc-200 bg-white px-6 font-medium focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">End Time (Optional)</label>
                      <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-14 rounded-2xl border-zinc-200 bg-white px-6 font-medium focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                          <Shuffle className="h-5 w-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-zinc-900 text-sm">Shuffle Order</h5>
                          <p className="text-[10px] text-zinc-400 font-medium">Randomize question sequence</p>
                        </div>
                      </div>
                      <Switch checked={isShuffled} onCheckedChange={(val) => setIsShuffled(val)} />
                    </div>

                    <div className="p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                          <FileQuestion className="h-5 w-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-zinc-900 text-sm">Dynamic Selection</h5>
                          <p className="text-[10px] text-zinc-400 font-medium">Auto-pick by difficulty</p>
                        </div>
                      </div>
                      <Switch checked={isRandomized} onCheckedChange={(val) => setIsRandomized(val)} />
                    </div>
                  </div>

                  {isRandomized ? (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Question Blueprint</label>
                        <p className="text-[10px] text-zinc-400 ml-1">Set how many questions from each difficulty level.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { id: "easy", label: "Easy", color: "emerald", state: easyCount, setState: setEasyCount, available: availableQuestionCounts.Easy },
                          { id: "moderate", label: "Moderate", color: "amber", state: moderateCount, setState: setModerateCount, available: availableQuestionCounts.Moderate },
                          { id: "hard", label: "Hard", color: "red", state: hardCount, setState: setHardCount, available: availableQuestionCounts.Hard }
                        ].map((level) => (
                          <div key={level.id} className="p-6 rounded-3xl border-2 border-zinc-100 bg-white space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                              <Badge className={cn(
                                "border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full",
                                level.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                                level.color === "amber" ? "bg-amber-100 text-amber-600" :
                                "bg-red-100 text-red-600"
                              )}>
                                {level.label}
                              </Badge>
                              <span className="text-[10px] font-bold text-zinc-400">{level.available} Available</span>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Desired Count</label>
                              <Input 
                                type="number"
                                min="0"
                                max={level.available}
                                value={level.state}
                                onChange={(e) => level.setState(e.target.value)}
                                className="h-12 rounded-xl border-zinc-100 bg-zinc-50 font-bold focus:bg-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Manual Selection</label>
                          <p className="text-[10px] text-zinc-400 ml-1">{selectedQuestions.length} items selected</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input 
                            placeholder="Search items..." 
                            value={modalQuestionSearch} 
                            onChange={(e) => setModalQuestionSearch(e.target.value)} 
                            className="h-10 pl-10 rounded-xl border-zinc-200 bg-white text-xs font-medium" 
                          />
                        </div>
                      </div>

                      <div className="border-2 border-dashed border-zinc-100 rounded-3xl overflow-hidden bg-white">
                        {filteredQuestions.length === 0 ? (
                          <div className="py-20 text-center">
                            <FileQuestion className="h-10 w-10 text-zinc-100 mx-auto mb-3" />
                            <p className="text-sm font-bold text-zinc-400">No questions match the criteria.</p>
                            <p className="text-[10px] text-zinc-300">Try selecting different programs above.</p>
                          </div>
                        ) : (
                          <div className="h-[400px] overflow-auto">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredQuestions.map(q => {
                                const qIdStr = q.id.toString();
                                const isSelected = selectedQuestions.includes(qIdStr);
                                return (
                                  <div 
                                    key={qIdStr} 
                                    className={cn(
                                      "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3", 
                                      isSelected ? "bg-primary/5 border-primary" : "bg-white border-zinc-100 hover:border-zinc-200"
                                    )} 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleQuestion(qIdStr);
                                    }}
                                  >
                                    <div className={cn("h-4 w-4 mt-0.5 rounded border flex items-center justify-center transition-colors", isSelected ? "bg-primary border-primary" : "border-zinc-300 bg-white")}>
                                      {isSelected && <div className="h-2 w-2 bg-white rounded-full" />}
                                    </div>
                                    <div className="space-y-2 flex-1 min-w-0">
                                      <p className="font-bold text-zinc-900 text-xs leading-tight line-clamp-2">{q.text}</p>
                                      <div className="flex gap-2">
                                        <Badge variant="secondary" className="bg-zinc-100 text-[8px] font-black uppercase tracking-widest text-zinc-400 border-none px-2 py-0.5 rounded-md">{q.courses?.name}</Badge>
                                        <Badge className={cn(
                                          "border-none font-bold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md",
                                          q.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600" :
                                          q.difficulty === "Hard" ? "bg-red-50 text-red-600" :
                                          "bg-amber-50 text-amber-600"
                                        )}>
                                          {q.difficulty}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-zinc-100">
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="rounded-xl h-12 px-6 font-bold text-zinc-500"
                    onClick={closeForm}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 font-bold text-white shadow-lg shadow-primary/20 flex items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingId ? "Update Assessment" : "Launch Assessment"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input 
            placeholder="Search assessments..." 
            className="h-12 pl-12 rounded-2xl border-zinc-200 bg-zinc-50/50 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-[240px]">
          <select 
            value={filterCourse} 
            onChange={(e) => setFilterCourse(e.target.value)}
            className="w-full h-12 rounded-2xl border-2 border-zinc-200 bg-zinc-50/50 px-6 font-bold text-sm focus:bg-white focus:border-primary focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Programs</option>
            {courses.map(c => <option key={c.id.toString()} value={c.id.toString()}>{c.name}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-zinc-100 animate-pulse" />
          ))
        ) : displayExams.length === 0 ? (
          <div className="col-span-full bg-zinc-50/50 rounded-3xl py-24 text-center border-2 border-dashed border-zinc-100">
            <ClipboardList className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">No assessments found</h3>
          </div>
        ) : (
          displayExams.map((exam) => (
            <Card key={exam.id} className="group border-zinc-100 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex flex-col h-full gap-6">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                          {exam.courses?.name || (exam.course_ids && exam.course_ids.length > 0 ? `${exam.course_ids.length} Programs` : "General")}
                        </Badge>
                        <Badge variant="outline" className="border-zinc-100 text-zinc-400 font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                          {exam.batches?.name || "Global"}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 leading-tight group-hover:text-primary transition-colors">
                        {exam.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5"
                        onClick={() => handleEdit(exam)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => {
                          setExamToDelete(exam);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-zinc-50 text-zinc-400 flex items-center justify-center">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Duration</p>
                        <p className="text-sm font-bold text-zinc-900">{exam.duration} Mins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-zinc-50 text-zinc-400 flex items-center justify-center">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</p>
                        <p className="text-sm font-bold text-zinc-900 truncate">
                          {exam.start_time ? new Date(exam.start_time).toLocaleDateString() : "Always Active"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl border-zinc-100 font-bold text-[10px] uppercase tracking-widest gap-2"
                      onClick={() => handleShare(exam)}
                    >
                        <Share2 className="h-3.5 w-3.5" />
                      Share Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm p-8">
          <DialogHeader>
            <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Delete Assessment?</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Permanently remove <span className="font-bold">{examToDelete?.title}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              variant="ghost" 
              className="w-full rounded-xl h-12 font-bold text-zinc-500"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
