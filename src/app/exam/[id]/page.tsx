"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, ChevronLeft, ChevronRight, Send, Loader2, Maximize, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired");

      let score = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) score++;
      });

      const { error } = await supabase.from("results").insert({
        student_id: session.user.id,
        exam_id: id,
        score,
        total: questions.length,
        answers
      });

      if (error) throw error;

      // Clean up localStorage
      localStorage.removeItem(`exam_end_time_${id}`);
      localStorage.removeItem(`exam_answers_${id}`);

      toast.success(isAutoSubmit ? "Time up! Exam submitted automatically." : `Exam submitted successfully!`);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
      setSubmitting(false);
    }
  }, [id, questions, answers, router, submitting]);

  // Anti-cheating: Fullscreen enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Anti-cheating: Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !loading && !submitting) {
        setWarningCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            handleSubmit(true);
            toast.error("Auto-submitting due to multiple tab switches.");
          } else {
            toast.warning(`Warning ${newCount}/3: Please stay on this tab. Next time may result in auto-submission.`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loading, submitting, handleSubmit]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/");

      // Check profile
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") return router.push("/");

      // Check if already taken
      const { data: existingResult } = await supabase.from("results").select("id").eq("exam_id", id).eq("student_id", session.user.id).single();
      if (existingResult) {
        toast.error("You have already completed this exam.");
        return router.push("/dashboard");
      }

        // Fetch exam
        const { data: examData } = await supabase.from("exams").select("*").eq("id", id).single();
        if (!examData) return router.push("/dashboard");

        let qs: any[] = [];

        if (examData.is_randomized) {
          // Check if already assigned
          const { data: assigned } = await supabase
            .from("student_exam_questions")
            .select(`question_id, questions (*)`)
            .eq("exam_id", id)
            .eq("student_id", session.user.id);

          if (assigned && assigned.length > 0) {
            qs = assigned.map(a => a.questions);
          } else {
            // Pick new random questions
            const { data: allAvailable } = await supabase
              .from("questions")
              .select("*")
              .in("course_id", examData.course_ids || []);

            if (!allAvailable) throw new Error("No questions available");

            const easyPool = allAvailable.filter(q => q.difficulty === "Easy");
            const moderatePool = allAvailable.filter(q => q.difficulty === "Moderate");
            const hardPool = allAvailable.filter(q => q.difficulty === "Hard");

            const pickRandom = (pool: any[], count: number) => {
              return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
            };

            const selectedEasy = pickRandom(easyPool, examData.easy_count || 0);
            const selectedModerate = pickRandom(moderatePool, examData.moderate_count || 0);
            const selectedHard = pickRandom(hardPool, examData.hard_count || 0);

            qs = [...selectedEasy, ...selectedModerate, ...selectedHard];

            // Save assignments
            if (qs.length > 0) {
              const assignments = qs.map(q => ({
                student_id: session.user.id,
                exam_id: id,
                question_id: q.id
              }));
              await supabase.from("student_exam_questions").insert(assignments);
            }
          }
        } else {
          // Fetch questions via junction table
          const { data: qData, error: qError } = await supabase
            .from("exam_questions")
            .select(`question_id, questions (*)`)
            .eq("exam_id", id);

          if (qError) {
            toast.error("Failed to load questions");
            return;
          }
          qs = qData?.map(item => item.questions) || [];
        }

        if (examData.is_shuffled) {
          qs = [...qs].sort(() => Math.random() - 0.5);
        }

      // Timer Persistence
      const savedEndTime = localStorage.getItem(`exam_end_time_${id}`);
      let endTime: number;

      if (savedEndTime) {
        endTime = parseInt(savedEndTime);
      } else {
        endTime = Date.now() + examData.duration * 60 * 1000;
        localStorage.setItem(`exam_end_time_${id}`, endTime.toString());
      }

      const calculatedTimeLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      
      // Answer Persistence
      const savedAnswers = localStorage.getItem(`exam_answers_${id}`);
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }

      setExam(examData);
      setQuestions(qs);
      setTimeLeft(calculatedTimeLeft);
      setLoading(false);
    };

    fetchData();
  }, [id, router]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const handleOptionSelect = (questionId: string, option: string) => {
    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);
    localStorage.setItem(`exam_answers_${id}`, JSON.stringify(newAnswers));
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={24} height={24} className="opacity-50" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-900 mb-1">Authenticating Session</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Preparing secure environment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isFullscreen && !loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 p-6">
        <Card className="max-w-md w-full border-none shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden">
          <div className="bg-primary p-8 text-white text-center">
            <Maximize className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-black tracking-tight">SECURE MODE REQUIRED</h2>
          </div>
          <CardContent className="p-8 text-center space-y-6">
            <p className="text-zinc-500 font-medium">
              To ensure a fair assessment, this exam must be taken in <span className="text-zinc-900 font-bold">Fullscreen Mode</span>. 
              Tab switching or exiting fullscreen will be recorded.
            </p>
            <Button 
              onClick={enterFullscreen}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm tracking-widest shadow-xl shadow-primary/20"
            >
              ENTER SECURE EXAM
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 select-none">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-black">
            {currentIndex + 1}
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-zinc-900">{exam.title}</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Total Questions: {questions.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={cn(
            "flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-all duration-500",
            timeLeft && timeLeft < 300 
              ? "bg-red-50 border-red-100 text-red-600 animate-pulse" 
              : "bg-zinc-50 border-zinc-100 text-zinc-900"
          )}>
            <Clock className={cn("h-4 w-4", timeLeft && timeLeft < 300 ? "text-red-600" : "text-zinc-400")} />
            <span className="font-mono text-xl font-black tabular-nums">
              {timeLeft ? formatTime(timeLeft) : "00:00"}
            </span>
          </div>
          
          <Button 
            onClick={() => handleSubmit()} 
            disabled={submitting}
            variant="ghost"
            className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-red-50 hover:bg-red-500 hover:text-white bg-red-500/90 shadow-lg shadow-red-500/20"
          >
            {submitting ? "SUBMITTING..." : "FINISH EXAM"}
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-12 px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Question Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
              Question {currentIndex + 1}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 leading-tight line-clamp-4">
              {currentQuestion?.text}
            </h2>
          </div>

          <div className="grid gap-4">
            {Object.entries(currentQuestion?.options || {}).map(([key, value]: [any, any]) => (
              <button
                key={key}
                onClick={() => handleOptionSelect(currentQuestion.id, key)}
                className={cn(
                  "flex items-center gap-6 p-6 rounded-[24px] border-2 text-left transition-all duration-200 group relative overflow-hidden",
                  answers[currentQuestion.id] === key 
                    ? "border-primary bg-primary/5 ring-4 ring-primary/5" 
                    : "border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black transition-colors shrink-0",
                  answers[currentQuestion.id] === key 
                    ? "bg-primary text-white" 
                    : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200"
                )}>
                  {key}
                </div>
                <span className={cn(
                  "text-lg font-medium transition-colors",
                  answers[currentQuestion.id] === key ? "text-zinc-900" : "text-zinc-600"
                )}>
                  {value}
                </span>
                {answers[currentQuestion.id] === key && (
                  <div className="absolute right-6 h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-12 border-t border-zinc-100">
            <Button
              variant="ghost"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <Button 
              onClick={() => currentIndex < questions.length - 1 ? setCurrentIndex(prev => prev + 1) : handleSubmit()}
              className="h-14 px-10 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm tracking-widest shadow-xl shadow-zinc-200"
            >
              {currentIndex === questions.length - 1 ? "FINISH ASSESSMENT" : "NEXT QUESTION"}
              {currentIndex < questions.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Right: Navigation Grid & Status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 rounded-[32px] bg-zinc-50 border border-zinc-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Navigation</h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase text-zinc-400">Done</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "aspect-square rounded-xl text-xs font-black transition-all duration-200",
                    currentIndex === idx 
                      ? "ring-2 ring-primary ring-offset-4 bg-primary text-white shadow-lg shadow-primary/20" 
                      : answers[q.id] 
                        ? "bg-primary/10 text-primary" 
                        : "bg-white border border-zinc-100 text-zinc-400 hover:border-zinc-200"
                  )}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-200/50 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50/50 text-orange-600">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider">Security Notice</p>
                  <p className="text-[11px] font-medium leading-relaxed opacity-80">
                    Your session is being monitored. Exiting fullscreen or switching tabs will be flagged.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
