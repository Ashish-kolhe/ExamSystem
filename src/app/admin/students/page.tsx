"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Search, 
  Trash2, 
  UserPlus, 
  BookOpen,
  Mail,
  Phone,
  Calendar,
  Loader2,
  X,
  UserCheck,
  GraduationCap,
  Save,
  Layers,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, courseFilter, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select(`
          *,
          student_enrollments (
            id,
            course_id,
            batch_id,
            courses (name),
            batches (name)
          )
        `)
        .eq("role", "student")
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      const { data: coursesData } = await supabase.from("courses").select("*");
      const { data: batchesData } = await supabase.from("batches").select("*");

      setStudents(studentsData || []);
      setCourses(coursesData || []);
      setBatches(batchesData || []);
    } catch (error: any) {
      toast.error("Failed to fetch students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", studentToDelete.id);
      if (error) throw error;
      toast.success("Student profile permanently removed");
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete student: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error("Please select a course to continue");
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase.from("student_enrollments").insert({
        student_id: selectedStudent.id,
        course_id: selectedCourse,
        batch_id: selectedBatch && selectedBatch !== "none" ? selectedBatch : null
      });

      if (error) throw error;

      toast.success(`${selectedStudent.first_name} is now enrolled`);
      setIsFormOpen(false);
      setSelectedCourse("");
      setSelectedBatch("");
      setSelectedStudent(null);
      fetchData();
    } catch (error: any) {
      toast.error("Enrollment failed: " + error.message);
    } finally {
      setEnrolling(false);
    }
  };

  const openEnrollForm = (student: any) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const fullName = `${student.first_name} ${student.father_name} ${student.surname}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                            student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            student.mobile?.includes(searchQuery);
      
      const matchesCourse = courseFilter === "all" || 
                           student.student_enrollments?.some((e: any) => e.course_id === courseFilter);
      
      const matchesTab = activeTab === "all" || 
                        (activeTab === "pending" && (!student.student_enrollments || student.student_enrollments.length === 0));
      
      return matchesSearch && matchesCourse && matchesTab;
    });
  }, [students, searchQuery, courseFilter, activeTab]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredStudents, currentPage]);

  const pendingCount = useMemo(() => {
    return students.filter(s => !s.student_enrollments || s.student_enrollments.length === 0).length;
  }, [students]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Student Directory</h1>
          <p className="text-zinc-500 font-medium">Manage student profiles and academic enrollments.</p>
        </div>
        <div className="px-6 py-3 bg-white rounded-xl border border-zinc-100 shadow-sm flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-zinc-900">{students.length} Total Students</span>
        </div>
      </div>

      {isFormOpen && (
        <div ref={formRef} className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-2 border-zinc-100 shadow-xl rounded-3xl overflow-hidden mb-12">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                Enroll Student: <span className="text-primary">{selectedStudent?.first_name} {selectedStudent?.surname}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10">
              <form onSubmit={handleEnroll} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Select Program</label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-200 bg-white font-medium focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Choose program" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {courses
                          .filter(course => !selectedStudent?.student_enrollments?.some((e: any) => e.course_id === course.id))
                          .map(course => (
                            <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Batch (Optional)</label>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-200 bg-white font-medium focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Independent Enrollment" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="none">Independent</SelectItem>
                        {batches.map(batch => (
                          <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-zinc-100">
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="rounded-xl h-12 px-6 font-bold text-zinc-500 hover:text-zinc-900"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 font-bold text-white shadow-lg shadow-primary/20 flex items-center gap-2"
                    disabled={enrolling}
                  >
                    {enrolling ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        <Save className="h-4 w-4" />
                        Complete Enrollment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
          <TabsList className="bg-zinc-100/50 p-1 rounded-2xl h-auto w-full lg:w-auto">
            <TabsTrigger value="all" className="rounded-xl px-8 py-3 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              All Students
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl px-8 py-3 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm relative">
              Pending
              {pendingCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded-md text-[8px] font-black">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full lg:max-w-2xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search by name, email..." 
              className="h-11 pl-11 rounded-xl border-zinc-200 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl border-zinc-200 bg-white text-xs font-bold">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Programs</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-50 animate-pulse" />
          ))
        ) : paginatedStudents.length === 0 ? (
          <div className="bg-zinc-50/50 rounded-3xl py-24 text-center border-2 border-dashed border-zinc-100">
            <Users className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">No students found</h3>
            <p className="text-zinc-500 font-medium">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          paginatedStudents.map((student) => (
            <StudentRow 
              key={student.id} 
              student={student} 
              onEnroll={openEnrollForm} 
              onDelete={(s: any) => { setStudentToDelete(s); setDeleteModalOpen(true); }} 
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm font-medium text-zinc-500">
            Showing <span className="text-zinc-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-zinc-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="text-zinc-900 font-bold">{filteredStudents.length}</span> students
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
            <DialogTitle className="text-center text-xl font-bold">Remove Student?</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Are you sure you want to delete <span className="font-bold">{studentToDelete?.first_name} {studentToDelete?.surname}</span>?
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
              {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentRow({ student, onEnroll, onDelete }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden transition-all hover:shadow-md">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {student.first_name[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 truncate">
              {student.first_name} {student.surname}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5 ml-2">
            {student.student_enrollments?.length > 0 ? (
              student.student_enrollments.map((enroll: any) => (
                <Badge key={enroll.id} className="bg-emerald-50 text-emerald-700 border-none font-bold text-[9px] uppercase tracking-widest rounded-lg px-2 py-0.5">
                  {enroll.courses?.name}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="border-dashed border-zinc-200 text-zinc-300 font-bold text-[9px] uppercase tracking-widest rounded-lg px-2 py-0.5">
                No Enrollment
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5"
            onClick={(e) => { e.stopPropagation(); onEnroll(student); }}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); onDelete(student); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className={cn("text-zinc-400 transition-transform duration-200 ml-1", isOpen && "rotate-180")}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="px-14 pb-5 pt-2 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-50 bg-zinc-50/30">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Email Address
              </label>
              <p className="text-xs font-bold text-zinc-600 truncate">{student.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                Phone Number
              </label>
              <p className="text-xs font-bold text-zinc-600">{student.mobile || "Not provided"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Date Joined
              </label>
              <p className="text-xs font-bold text-zinc-600">
                {new Date(student.created_at).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
