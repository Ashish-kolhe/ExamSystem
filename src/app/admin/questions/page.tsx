"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Loader2,
  FileQuestion,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Undo2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [courseFilter, setCourseFilter] = useState("all");
    const [difficultyFilter, setDifficultyFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, courseFilter, difficultyFilter]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [text, setText] = useState("");
  const [courseId, setCourseId] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("Moderate");
  const [options, setOptions] = useState({ A: "", B: "", C: "", D: "" });
  const [correctAnswer, setCorrectAnswer] = useState<string>("");

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: questionsData },
        { data: coursesData }
      ] = await Promise.all([
        supabase.from("questions").select("*, courses(name)").order("created_at", { ascending: false }),
        supabase.from("courses").select("*").order("name")
      ]);
      
      setQuestions(questionsData || []);
      setCourses(coursesData || []);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFormFields = useCallback(() => {
    setEditingId(null);
    setText("");
    setDifficulty("Moderate");
    setOptions({ A: "", B: "", C: "", D: "" });
    setCorrectAnswer("");
    setCourseId("all");
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    resetFormFields();
  }, [resetFormFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || courseId === "all" || !correctAnswer) return toast.error("Required fields missing");

    setSubmitting(true);
    const questionData = {
      text,
      course_id: courseId,
      difficulty,
      options,
      correct_answer: correctAnswer
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("questions").update(questionData).eq("id", editingId);
        if (error) throw error;
        toast.success("Question updated successfully");
        closeForm();
      } else {
        const { error } = await supabase.from("questions").insert(questionData);
        if (error) throw error;
        toast.success("New question added to bank");
        resetFormFields();
      }
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = useCallback((q: any) => {
    setText(q.text || "");
    setCourseId(q.course_id?.toString() || "all");
    setDifficulty(q.difficulty || "Moderate");
    setOptions(q.options || { A: "", B: "", C: "", D: "" });
    setCorrectAnswer(q.correct_answer || "");
    setEditingId(q.id);
    
    scrollRequestRef.current = true;
    setIsFormOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!questionToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("questions").delete().eq("id", questionToDelete.id);
      if (error) throw error;
      toast.success("Question removed from bank");
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    const search = searchQuery.toLowerCase();
      return questions.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(search);
        const matchesCourse = courseFilter === "all" || q.course_id === courseFilter;
        const matchesDifficulty = difficultyFilter === "all" || q.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();
        return matchesSearch && matchesCourse && matchesDifficulty;
      });
  }, [questions, searchQuery, courseFilter, difficultyFilter]);

    const stats = useMemo(() => {
      const search = searchQuery.toLowerCase();
      const base = questions.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(search);
        const matchesCourse = courseFilter === "all" || q.course_id === courseFilter;
        return matchesSearch && matchesCourse;
      });
      
      return {
        total: base.length,
        easy: base.filter(q => q.difficulty?.toLowerCase() === "easy").length,
        moderate: base.filter(q => q.difficulty?.toLowerCase() === "moderate").length,
        hard: base.filter(q => q.difficulty?.toLowerCase() === "hard").length,
      };
    }, [questions, searchQuery, courseFilter]);

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = useMemo(() => {
    return filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredQuestions, currentPage]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Question Repository</h1>
          <p className="text-zinc-500 font-medium">Manage and organize your examination questions bank.</p>
        </div>
        <Button 
          onClick={() => isFormOpen ? closeForm() : setIsFormOpen(true)}
          className={cn(
            "h-12 px-6 rounded-xl font-bold transition-all flex items-center gap-2",
            isFormOpen ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {isFormOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isFormOpen ? "Close Form" : "Create Question"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Questions", value: stats.total, color: "zinc", icon: FileQuestion },
          { label: "Easy Level", value: stats.easy, color: "emerald", icon: CheckCircle2 },
          { label: "Moderate Level", value: stats.moderate, color: "amber", icon: ChevronUp },
          { label: "Hard Level", value: stats.hard, color: "red", icon: X },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
              item.color === "zinc" ? "bg-zinc-50 text-zinc-400" :
              item.color === "emerald" ? "bg-emerald-50 text-emerald-500" :
              item.color === "amber" ? "bg-amber-50 text-amber-500" :
              "bg-red-50 text-red-500"
            )}>
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">{item.label}</p>
              <p className="text-2xl font-black text-zinc-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div ref={formRef} className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-2 border-zinc-100 shadow-xl rounded-3xl overflow-hidden mb-12">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                {editingId ? "Update Question" : "Add New Question"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Select Course</label>
                        <select 
                          value={courseId} 
                          onChange={(e) => setCourseId(e.target.value)}
                          required
                          className="w-full h-14 rounded-2xl border-2 border-zinc-200 bg-white px-6 font-bold text-sm focus:border-primary focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem' }}
                        >
                          <option value="all" disabled>Select a course</option>
                          {courses.map(c => (
                            <option key={c.id.toString()} value={c.id.toString()}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Difficulty Level</label>
                        <select 
                          value={difficulty} 
                          onChange={(e) => setDifficulty(e.target.value)}
                          required
                          className="w-full h-14 rounded-2xl border-2 border-zinc-200 bg-white px-6 font-bold text-sm focus:border-primary focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem' }}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Correct Option</label>
                        <select 
                          value={correctAnswer} 
                          onChange={(e) => setCorrectAnswer(e.target.value)}
                          required
                          className={cn(
                            "w-full h-14 rounded-2xl border-2 border-zinc-200 bg-white px-6 font-bold text-sm focus:border-primary focus:ring-0 outline-none transition-all appearance-none cursor-pointer",
                            correctAnswer && "border-emerald-200 bg-emerald-50/30 text-emerald-700"
                          )}
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem' }}
                        >
                          <option value="" disabled>Mark the correct answer</option>
                          {['A', 'B', 'C', 'D'].map(o => (
                            <option key={o} value={o}>
                              Option {o}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Question Content</label>
                  <Textarea 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    required 
                    placeholder="Enter your question text here..."
                    className="min-h-[120px] rounded-2xl border-zinc-200 bg-white p-6 font-medium text-lg focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Option {opt}</label>
                        {correctAnswer === opt && (
                          <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase tracking-widest rounded-md px-2 py-0.5">Correct</Badge>
                        )}
                      </div>
                      <Input 
                        value={(options as any)[opt]} 
                        onChange={(e) => setOptions(prev => ({...prev, [opt]: e.target.value}))} 
                        required 
                        placeholder={`Choice ${opt}`}
                        className={cn(
                          "h-14 rounded-2xl border-zinc-200 bg-white px-6 font-medium focus:ring-2 focus:ring-primary/20",
                          correctAnswer === opt && "border-emerald-200 bg-emerald-50/30"
                        )}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-zinc-100">
                    <Button 
                      type="button"
                      variant="ghost" 
                      className="rounded-xl h-12 px-6 font-bold text-zinc-500 hover:text-zinc-900"
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
                        {editingId ? "Save Changes" : "Create Question"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input 
            placeholder="Search questions..." 
            className="h-12 pl-12 rounded-2xl border-zinc-200 bg-zinc-50/50 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-[200px]">
          <select 
            value={courseFilter} 
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full h-12 rounded-2xl border-2 border-zinc-200 bg-zinc-50/50 px-6 font-bold text-sm focus:bg-white focus:border-primary focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id.toString()} value={c.id.toString()}>{c.name}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        <div className="relative w-full md:w-[200px]">
          <select 
            value={difficultyFilter} 
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full h-12 rounded-2xl border-2 border-zinc-200 bg-zinc-50/50 px-6 font-bold text-sm focus:bg-white focus:border-primary focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Hard">Hard</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-50 animate-pulse" />
          ))
        ) : paginatedQuestions.length === 0 ? (
          <div className="bg-zinc-50/50 rounded-3xl py-24 text-center border-2 border-dashed border-zinc-100">
            <FileQuestion className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">No questions found</h3>
            <p className="text-zinc-500">Try adjusting your search or add a new question.</p>
          </div>
        ) : (
          paginatedQuestions.map((q) => (
            <div key={q.id} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl hover:shadow-md transition-all group">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    q.difficulty?.toLowerCase() === "easy" ? "bg-emerald-500" :
                    q.difficulty?.toLowerCase() === "hard" ? "bg-red-500" :
                    "bg-amber-500"
                  )} />
                  <p className="text-sm font-bold text-zinc-900 line-clamp-2 flex-1">
                    {q.text}
                  </p>
                <Badge className="bg-zinc-100 text-zinc-500 hover:bg-zinc-100 border-none font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md hidden sm:flex">
                  {q.courses?.name}
                </Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5"
                  onClick={() => handleEdit(q)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setQuestionToDelete(q);
                    setDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm font-medium text-zinc-500">
            Showing <span className="text-zinc-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-zinc-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredQuestions.length)}</span> of <span className="text-zinc-900 font-bold">{filteredQuestions.length}</span> questions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-10 w-10 border-zinc-200"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      className={cn(
                        "h-10 w-10 rounded-xl font-bold",
                        currentPage === page ? "bg-primary text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      )}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                } else if (
                  (page === currentPage - 2 && page > 1) ||
                  (page === currentPage + 2 && page < totalPages)
                ) {
                  return <span key={page} className="px-1 text-zinc-400 font-bold">...</span>;
                }
                return null;
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-10 w-10 border-zinc-200"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm p-8">
          <DialogHeader>
            <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Delete Question?</DialogTitle>
            <DialogDescription className="text-center pt-2">
              This will permanently remove the question from your repository.
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
