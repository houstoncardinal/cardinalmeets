import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Meeting {
  id: string;
  meeting_code: string;
  title: string;
  description: string | null;
  host_id: string;
  scheduled_at: string | null;
  duration_minutes: number;
  status: "scheduled" | "active" | "ended" | "cancelled";
  is_recurring: boolean;
  password: string | null;
  waiting_room_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateMeetingData {
  title: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  password?: string;
  waiting_room_enabled?: boolean;
}

export function useMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    } else {
      setMeetings([]);
      setLoading(false);
    }
  }, [user]);

  const fetchMeetings = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .order("scheduled_at", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching meetings:", error);
    } else {
      setMeetings(data as Meeting[]);
    }
    setLoading(false);
  };

  const generateMeetingCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 3; i++) {
      result += chars[Math.floor(Math.random() * 26)];
    }
    result += "-";
    for (let i = 0; i < 4; i++) {
      result += chars[Math.floor(Math.random() * 26)];
    }
    result += "-";
    for (let i = 0; i < 3; i++) {
      result += chars[Math.floor(Math.random() * 26)];
    }
    return result;
  };

  const createMeeting = async (data: CreateMeetingData) => {
    if (!user) return { error: new Error("Not authenticated") };

    const meetingCode = generateMeetingCode();
    
    const { data: newMeeting, error } = await supabase
      .from("meetings")
      .insert({
        meeting_code: meetingCode,
        title: data.title,
        description: data.description || null,
        host_id: user.id,
        scheduled_at: data.scheduled_at || null,
        duration_minutes: data.duration_minutes || 60,
        password: data.password || null,
        waiting_room_enabled: data.waiting_room_enabled ?? true,
        status: data.scheduled_at ? "scheduled" : "active",
      })
      .select()
      .single();

    if (!error && newMeeting) {
      setMeetings((prev) => [...prev, newMeeting as Meeting]);
    }

    return { data: newMeeting as Meeting | null, error };
  };

  const updateMeetingStatus = async (meetingId: string, status: Meeting["status"]) => {
    const { error } = await supabase
      .from("meetings")
      .update({ status })
      .eq("id", meetingId);

    if (!error) {
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, status } : m))
      );
    }

    return { error };
  };

  const deleteMeeting = async (meetingId: string) => {
    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", meetingId);

    if (!error) {
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    }

    return { error };
  };

  const getMeetingByCode = async (code: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("meeting_code", code)
      .single();

    return { data: data as Meeting | null, error };
  };

  return {
    meetings,
    loading,
    createMeeting,
    updateMeetingStatus,
    deleteMeeting,
    getMeetingByCode,
    refetch: fetchMeetings,
  };
}
