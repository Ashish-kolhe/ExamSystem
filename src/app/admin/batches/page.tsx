"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Loader2,
  Layers,
  Calendar,
  Users,
  X,
  Save,
  LayoutGrid
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const [
      { data: batchesData, error: batchesError },
      { data: coursesData, error: coursesError }
    ] = await Promise.all([
      supabase.from("batches").select("*, courses(name)").order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("name")
    ]);
    
    if (batchesError) toast.error(batchesError.message);
    else setBatches(batchesData || []);
    
    if (coursesError) toast.error(coursesError.message);
    else setCourses(coursesData || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCourseId("");
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return toast.error("Please select a program association");

    setSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("batches")
          .update({ name, course_id: courseId })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Batch configuration updated");
      } else {
        const { error } = await supabase
          .from("batches")
          .insert({ name, course_id: courseId });
        if (error) throw error;
        toast.success("New student group initialized");
      }
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (batch: any) => {
    setEditingId(batch.id);
    setName(batch.name);
    setCourseId(batch.course_id);
    setIsFormOpen(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!batchToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("batches").delete().eq("id", batchToDelete.id);
      if (error) throw error;
      toast.success("Group removed from curriculum");
      setDeleteModalOpen(false);
      setBatchToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.courses?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Student Groups</h1>
          <p className="text-zinc-500 font-medium">Organize students into batches for easier management.</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={cn(
            "h-12 px-6 rounded-xl font-bold transition-all flex items-center gap-2",
            isFormOpen ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {isFormOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isFormOpen ? "Close Form" : "Create Batch"}
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
              {editingId ? "Update Batch" : "New Student Group"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Batch Name</label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    placeholder="e.g. MORNING_2024_A"
                    className="h-14 rounded-2xl border-zinc-200 bg-white px-6 font-medium focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Academic Program</label>
                  <Select value={courseId} onValueChange={setCourseId} required>
                    <SelectTrigger className="h-14 rounded-2xl border-zinc-200 bg-white font-medium focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
                      {editingId ? "Update Batch" : "Create Batch"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <Input 
          placeholder="Search batches..." 
          className="h-12 pl-12 rounded-2xl border-zinc-200 bg-white shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-zinc-100 animate-pulse" />
          ))
        ) : filteredBatches.length === 0 ? (
          <div className="col-span-full bg-zinc-50/50 rounded-3xl py-24 text-center border-2 border-dashed border-zinc-100">
            <Layers className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">No batches found</h3>
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <Card key={batch.id} className="group border-zinc-100 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/5"
                      onClick={() => handleEdit(batch)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setBatchToDelete(batch);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 truncate">{batch.name}</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{batch.courses?.name}</p>
                  </div>
                  <div className="pt-4 border-t border-zinc-50 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(batch.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Active
                    </div>
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
            <DialogTitle className="text-center text-xl font-bold">Delete Batch?</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Are you sure you want to delete <span className="font-bold">{batchToDelete?.name}</span>?
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
