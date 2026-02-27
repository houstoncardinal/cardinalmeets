import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PollOption {
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  is_active: boolean;
  is_anonymous: boolean;
  allow_multiple: boolean;
  created_by: string;
  created_at: string;
  myVotes: number[];
}

export function usePolls(meetingId: string) {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPolls = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);

    const { data: pollsData } = await supabase
      .from("meeting_polls")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });

    if (pollsData) {
      const pollsWithVotes = await Promise.all(
        pollsData.map(async (poll: any) => {
          const { data: votes } = await supabase
            .from("poll_votes")
            .select("*")
            .eq("poll_id", poll.id);

          const options = (poll.options as any[]).map((opt: any, idx: number) => ({
            text: opt.text || opt,
            votes: votes?.filter((v: any) => v.option_index === idx).length || 0,
          }));

          const myVotes = votes
            ?.filter((v: any) => v.user_id === user?.id)
            .map((v: any) => v.option_index) || [];

          return {
            id: poll.id,
            question: poll.question,
            options,
            is_active: poll.is_active,
            is_anonymous: poll.is_anonymous,
            allow_multiple: poll.allow_multiple,
            created_by: poll.created_by,
            created_at: poll.created_at,
            myVotes,
          };
        })
      );
      setPolls(pollsWithVotes);
    }
    setLoading(false);
  }, [meetingId, user?.id]);

  useEffect(() => {
    fetchPolls();

    const channel = supabase
      .channel(`polls:${meetingId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "meeting_polls",
        filter: `meeting_id=eq.${meetingId}`,
      }, () => fetchPolls())
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "poll_votes",
      }, () => fetchPolls())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meetingId, fetchPolls]);

  const createPoll = useCallback(async (question: string, options: string[], isAnonymous = false, allowMultiple = false) => {
    if (!user || !meetingId) return;
    await supabase.from("meeting_polls").insert({
      meeting_id: meetingId,
      created_by: user.id,
      question,
      options: options.map((text) => ({ text })),
      is_anonymous: isAnonymous,
      allow_multiple: allowMultiple,
    } as any);
  }, [user, meetingId]);

  const vote = useCallback(async (pollId: string, optionIndex: number) => {
    if (!user) return;
    await supabase.from("poll_votes").insert({
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex,
    } as any);
  }, [user]);

  const endPoll = useCallback(async (pollId: string) => {
    await supabase.from("meeting_polls").update({
      is_active: false,
      ended_at: new Date().toISOString(),
    } as any).eq("id", pollId);
  }, []);

  return { polls, loading, createPoll, vote, endPoll, refreshPolls: fetchPolls };
}
