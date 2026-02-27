import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Question {
  id: string;
  question: string;
  asked_by: string;
  answer: string | null;
  is_answered: boolean;
  is_pinned: boolean;
  upvotes: number;
  hasUpvoted: boolean;
  created_at: string;
}

export function useQuestions(meetingId: string) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);

    const { data } = await supabase
      .from("meeting_questions")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("upvotes", { ascending: false });

    if (data) {
      const { data: myUpvotes } = await supabase
        .from("question_upvotes")
        .select("question_id")
        .eq("user_id", user?.id || "");

      const upvotedIds = new Set(myUpvotes?.map((u: any) => u.question_id) || []);

      setQuestions(
        data.map((q: any) => ({
          id: q.id,
          question: q.question,
          asked_by: q.asked_by,
          answer: q.answer,
          is_answered: q.is_answered,
          is_pinned: q.is_pinned,
          upvotes: q.upvotes,
          hasUpvoted: upvotedIds.has(q.id),
          created_at: q.created_at,
        }))
      );
    }
    setLoading(false);
  }, [meetingId, user?.id]);

  useEffect(() => {
    fetchQuestions();

    const channel = supabase
      .channel(`questions:${meetingId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "meeting_questions",
        filter: `meeting_id=eq.${meetingId}`,
      }, () => fetchQuestions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meetingId, fetchQuestions]);

  const askQuestion = useCallback(async (question: string) => {
    if (!user || !meetingId) return;
    await supabase.from("meeting_questions").insert({
      meeting_id: meetingId,
      asked_by: user.id,
      question,
    } as any);
  }, [user, meetingId]);

  const answerQuestion = useCallback(async (questionId: string, answer: string) => {
    if (!user) return;
    await supabase.from("meeting_questions").update({
      answer,
      answered_by: user.id,
      is_answered: true,
      answered_at: new Date().toISOString(),
    } as any).eq("id", questionId);
  }, [user]);

  const toggleUpvote = useCallback(async (questionId: string, hasUpvoted: boolean) => {
    if (!user) return;
    if (hasUpvoted) {
      await supabase.from("question_upvotes")
        .delete()
        .eq("question_id", questionId)
        .eq("user_id", user.id);
      await supabase.from("meeting_questions")
        .update({ upvotes: questions.find(q => q.id === questionId)!.upvotes - 1 } as any)
        .eq("id", questionId);
    } else {
      await supabase.from("question_upvotes").insert({
        question_id: questionId,
        user_id: user.id,
      } as any);
      await supabase.from("meeting_questions")
        .update({ upvotes: questions.find(q => q.id === questionId)!.upvotes + 1 } as any)
        .eq("id", questionId);
    }
  }, [user, questions]);

  const pinQuestion = useCallback(async (questionId: string, isPinned: boolean) => {
    await supabase.from("meeting_questions")
      .update({ is_pinned: !isPinned } as any)
      .eq("id", questionId);
  }, []);

  return { questions, loading, askQuestion, answerQuestion, toggleUpvote, pinQuestion };
}
