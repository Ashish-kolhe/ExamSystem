"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Loader2,
  Calendar,
  FileText,
  Save,
  X,
  Layers,
  Users,
  ClipboardList,
  GraduationCap
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [examsModalOpen, setExamsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [courseExams, setCourseExams] = useState<any[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          student_enrollments(count)
        `)
        .order("created_at", { ascending: false });
      
      if (coursesError) throw coursesError;

      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("id, course_id, course_ids");

      if (examsError) throw examsError;

      const coursesWithCounts = (coursesData || []).map(course => {
        const examCount = (examsData || []).filter(exam => 
          exam.course_id === course.id || 
          (exam.course_ids && exam.course_ids.includes(course.id))
        ).length;

        return {
          ...course,
          studentCount: course.student_enrollments?.[0]?.count || 0,
          examCount: examCount
        };
      });

      setCourses(coursesWithCounts);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Program name is required");

    setSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("courses")
          .update({ name, description })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Program updated");
      } else {
        const { error } = await supabase
          .from("courses")
          .insert({ name, description });
        if (error) throw error;
        toast.success("New program launched");
      }
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course: any) => {
    setEditingId(course.id);
    setName(course.name);
    setDescription(course.description || "");
    setIsFormOpen(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseToDelete.id);
      if (error) throw error;
      toast.success("Program removed from system");
      setDeleteModalOpen(false);
      setCourseToDelete(null);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewStudents = async (course: any) => {
    setSelectedCourse(course);
    setStudentsModalOpen(true);
    setFetchingDetails(true);
    try {
      const { data: students, error: studentError } = await supabase
        .from("student_enrollments")
        .select(`
          student_id,
          profiles:student_id (
            first_name,
            father_name,
            surname,
            email
          )
        `)
        .eq("course_id", course.id);
      
      if (studentError) throw studentError;
      setCourseStudents(students || []);
    } catch (error: any) {
      toast.error("Failed to load students");
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleViewExams = async (course: any) => {
    setSelectedCourse(course);
    setExamsModalOpen(true);
    setFetchingDetails(true);
    try {
      const { data: exams, error: examError } = await supabase
        .from("exams")
        .select("*")
        .or(`course_id.eq.${course.id},course_ids.cs.{${course.id}}`);
      
      if (examError) throw examError;
      setCourseExams(exams || []);
    } catch (error: any) {
      toast.error("Failed to load exams");
    } finally {
      setFetchingDetails(false);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Academic Programs</h1>
          <p className="text-zinc-500 font-medium">Manage the curriculum and courses for Shree Genius IT Hub.</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={cn(
            "h-12 px-6 rounded-xl font-bold transition-all flex items-center gap-2",
            isFormOpen ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {isFormOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isFormOpen ? "Close Form" : "Add Program"}
        </Button>
      </div>

      {/* In-page Dropdown Form */}
      <div ref={formRef} className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isFormOpen ? "max-h-[1000px] opacity-100 mb-12" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <Card className="border-2 border-zinc-100 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
              {editingId ? "Update Program" : "Launch New Program"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Program Name</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="e.g. Advanced Web Development"
                  className="h-14 rounded-2xl border-zinc-200 bg-white px-6 font-medium focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Description</label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Detailed outline of the curriculum..."
                  className="min-h-[150px] rounded-2xl border-zinc-200 bg-white p-6 font-medium focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-zinc-100">
                <Button 
                  type="button"
                  variant="ghost" 
                  className="rounded-xl h-12 px-6 font-bold text-zinc-500"
                  onClick={resetForm}
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
                      {editingId ? "Update Program" : "Create Program"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input 
            placeholder="Search programs..." 
            className="h-12 pl-12 rounded-2xl border-zinc-200 bg-zinc-50/50 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-zinc-100 animate-pulse" />
          ))
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full bg-zinc-50/50 rounded-3xl py-24 text-center border-2 border-dashed border-zinc-100">
            <BookOpen className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">No programs found</h3>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.id} className="group border-zinc-100 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                          <Layers className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 truncate max-w-[200px] md:max-w-md">
                          {course.name}
                        </h3>
                      </div>
                      <p className="text-zinc-500 text-sm line-clamp-2 mt-1">
                        {course.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5"
                        onClick={() => handleEdit(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => {
                          setCourseToDelete(course);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-full h-9 px-4 border-zinc-100 bg-zinc-50/50 font-bold text-[10px] uppercase tracking-widest text-zinc-500 hover:bg-zinc-100"
                      onClick={() => handleViewStudents(course)}
                    >
                      <Users className="h-3 w-3 mr-2 opacity-60" />
                      {course.studentCount} Students
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-full h-9 px-4 border-zinc-100 bg-zinc-50/50 font-bold text-[10px] uppercase tracking-widest text-zinc-500 hover:bg-zinc-100"
                      onClick={() => handleViewExams(course)}
                    >
                      <ClipboardList className="h-3 w-3 mr-2 opacity-60" />
                      {course.examCount} Exams
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Other Modals (Students, Exams, Delete) remain as Modals as they are view-only or confirmation */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm p-8">
          <DialogHeader>
            <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Delete Program?</DialogTitle>
            <DialogDescription className="text-center pt-2">
              All data associated with <span className="font-bold">{courseToDelete?.name}</span> will be permanently removed.
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

      <Dialog open={studentsModalOpen} onOpenChange={setStudentsModalOpen}>
        <DialogContent className="rounded-[40px] max-w-4xl p-0 overflow-hidden bg-white shadow-2xl border-none">
          <div className="p-10 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold text-zinc-900">Enrolled Students</DialogTitle>
            </div>
            <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-none px-4 py-2 rounded-xl font-bold">
              {courseStudents.length} Students
            </Badge>
          </div>
          <div className="p-10 max-h-[60vh] overflow-y-auto">
            {fetchingDetails ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-zinc-200 animate-spin" />
              </div>
            ) : courseStudents.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-400 font-medium">No students enrolled yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseStudents.map((enrollment, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50/30 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center font-bold text-zinc-400 text-xs shadow-sm">
                      {enrollment.profiles?.first_name?.[0]}{enrollment.profiles?.surname?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">
                        {enrollment.profiles?.first_name} {enrollment.profiles?.surname}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-medium">{enrollment.profiles?.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={examsModalOpen} onOpenChange={setExamsModalOpen}>
        <DialogContent className="rounded-[40px] max-w-4xl p-0 overflow-hidden bg-white shadow-2xl border-none">
          <div className="p-10 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ClipboardList className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold text-zinc-900">Associated Exams</DialogTitle>
            </div>
            <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-none px-4 py-2 rounded-xl font-bold">
              {courseExams.length} Exams
            </Badge>
          </div>
          <div className="p-10 max-h-[60vh] overflow-y-auto">
            {fetchingDetails ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-zinc-200 animate-spin" />
              </div>
            ) : courseExams.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-400 font-medium">No exams found for this program.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseExams.map((exam) => (
                  <div key={exam.id} className="p-6 rounded-2xl border border-zinc-100 bg-zinc-50/30">
                    <h4 className="font-bold text-zinc-900 mb-2">{exam.title}</h4>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-zinc-100 text-zinc-400 px-3 py-1 rounded-full">
                        {exam.duration} MINS
                      </Badge>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-zinc-100 text-zinc-400 px-3 py-1 rounded-full">
                        {exam.passing_marks} PASS
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
