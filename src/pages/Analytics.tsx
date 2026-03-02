import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  BarChart3,
  Clock,
  Users,
  MessageSquare,
  ThumbsUp,
  ArrowLeft,
  Video,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MeetingAnalytic {
  id: string;
  meeting_id: string;
  user_id: string;
  joined_at: string | null;
  left_at: string | null;
  total_talk_time_seconds: number | null;
  reactions_count: number | null;
  messages_count: number | null;
  hand_raises_count: number | null;
}

interface MeetingWithAnalytics {
  id: string;
  title: string;
  meeting_code: string;
  scheduled_at: string | null;
  status: string;
  analytics: MeetingAnalytic[];
}

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    const { data: meetingsData } = await supabase
      .from("meetings")
      .select("id, title, meeting_code, scheduled_at, status")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!meetingsData) {
      setLoading(false);
      return;
    }

    const meetingsWithAnalytics: MeetingWithAnalytics[] = [];

    for (const meeting of meetingsData) {
      const { data: analytics } = await supabase
        .from("meeting_analytics")
        .select("*")
        .eq("meeting_id", meeting.id);

      meetingsWithAnalytics.push({
        ...meeting,
        analytics: analytics || [],
      });
    }

    setMeetings(meetingsWithAnalytics);
    setLoading(false);
  };

  const totalMeetings = meetings.length;
  const totalParticipants = meetings.reduce((sum, m) => sum + m.analytics.length, 0);
  const totalTalkTime = meetings.reduce(
    (sum, m) => sum + m.analytics.reduce((s, a) => s + (a.total_talk_time_seconds || 0), 0),
    0
  );
  const totalReactions = meetings.reduce(
    (sum, m) => sum + m.analytics.reduce((s, a) => s + (a.reactions_count || 0), 0),
    0
  );

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Meeting Analytics</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMeetings}</p>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                <Clock className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDuration(totalTalkTime)}</p>
                <p className="text-sm text-muted-foreground">Total Talk Time</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-5/10">
                <ThumbsUp className="h-6 w-6 text-chart-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReactions}</p>
                <p className="text-sm text-muted-foreground">Total Reactions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meeting Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Meeting Engagement
            </CardTitle>
            <CardDescription>Per-meeting analytics breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-medium">No analytics yet</h3>
                <p className="text-sm text-muted-foreground">
                  Host meetings to see engagement data
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {meetings.map((meeting) => {
                  const participantCount = meeting.analytics.length;
                  const meetingTalkTime = meeting.analytics.reduce(
                    (s, a) => s + (a.total_talk_time_seconds || 0), 0
                  );
                  const meetingReactions = meeting.analytics.reduce(
                    (s, a) => s + (a.reactions_count || 0), 0
                  );
                  const meetingMessages = meeting.analytics.reduce(
                    (s, a) => s + (a.messages_count || 0), 0
                  );
                  const maxTalkTime = Math.max(
                    ...meeting.analytics.map((a) => a.total_talk_time_seconds || 0), 1
                  );

                  return (
                    <div key={meeting.id} className="rounded-lg border border-border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{meeting.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {meeting.scheduled_at
                              ? format(new Date(meeting.scheduled_at), "MMM d, yyyy h:mm a")
                              : "Instant meeting"}
                          </p>
                        </div>
                        <Badge variant={meeting.status === "active" ? "default" : "secondary"}>
                          {meeting.status}
                        </Badge>
                      </div>

                      <div className="mb-4 grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold">{participantCount}</p>
                          <p className="text-xs text-muted-foreground">Participants</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{formatDuration(meetingTalkTime)}</p>
                          <p className="text-xs text-muted-foreground">Talk Time</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{meetingMessages}</p>
                          <p className="text-xs text-muted-foreground">Messages</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{meetingReactions}</p>
                          <p className="text-xs text-muted-foreground">Reactions</p>
                        </div>
                      </div>

                      {meeting.analytics.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Talk Time Distribution</p>
                          {meeting.analytics.map((a, i) => (
                            <div key={a.id} className="flex items-center gap-3">
                              <span className="w-24 truncate text-xs text-muted-foreground">
                                Participant {i + 1}
                              </span>
                              <Progress
                                value={((a.total_talk_time_seconds || 0) / maxTalkTime) * 100}
                                className="h-2 flex-1"
                              />
                              <span className="w-12 text-right text-xs text-muted-foreground">
                                {formatDuration(a.total_talk_time_seconds || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
