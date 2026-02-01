import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  MoreVertical,
  Trash2,
  Link,
  LogOut,
  User,
  Settings,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMeetings } from "@/hooks/useMeetings";
import { useMeetingInvitations } from "@/hooks/useMeetingInvitations";
import { ScheduleMeetingDialog } from "@/components/dashboard/ScheduleMeetingDialog";
import { JoinMeetingDialog } from "@/components/dashboard/JoinMeetingDialog";
import { InviteParticipantsDialog } from "@/components/meeting/InviteParticipantsDialog";

interface Meeting {
  id: string;
  meeting_code: string;
  title: string;
  scheduled_at: string | null;
  status: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { meetings, loading, createMeeting, deleteMeeting, updateMeetingStatus } = useMeetings();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const invitations = useMeetingInvitations(selectedMeeting?.id || "");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleStartInstantMeeting = async () => {
    const { data, error } = await createMeeting({
      title: "Instant Meeting",
    });

    if (error) {
      toast({
        title: "Failed to create meeting",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      navigate(`/meeting/${data.meeting_code}`);
    }
  };

  const handleJoinMeeting = (meetingCode: string) => {
    navigate(`/meeting/${meetingCode}`);
  };

  const handleCopyLink = (meetingCode: string) => {
    const url = `${window.location.origin}/meeting/${meetingCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Meeting link has been copied to clipboard.",
    });
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const { error } = await deleteMeeting(meetingId);
    if (error) {
      toast({
        title: "Failed to delete meeting",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Meeting deleted",
        description: "The meeting has been removed.",
      });
    }
  };

  const handleInvite = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsInviteOpen(true);
  };

  const handleSendInvitations = async (emails: string[]) => {
    if (!selectedMeeting) return;
    
    for (const email of emails) {
      await invitations.sendInvitation(
        email,
        selectedMeeting.title,
        selectedMeeting.meeting_code,
        selectedMeeting.scheduled_at || undefined
      );
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "Instant";
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  const getStatusBadge = (status: string, scheduledAt: string | null) => {
    if (status === "active") {
      return <Badge className="bg-accent hover:bg-accent/90">Live</Badge>;
    }
    if (status === "ended") {
      return <Badge variant="secondary">Ended</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (scheduledAt && isPast(new Date(scheduledAt))) {
      return <Badge variant="outline">Ready to start</Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const upcomingMeetings = meetings.filter(
    (m) => m.status === "scheduled" && m.scheduled_at && !isPast(new Date(m.scheduled_at))
  );
  const pastMeetings = meetings.filter(
    (m) => m.status === "ended" || (m.scheduled_at && isPast(new Date(m.scheduled_at)))
  );

  const userInitials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || user?.email?.[0].toUpperCase() || "U";

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MeetFlow</span>
          </a>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user.user_metadata?.full_name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={handleStartInstantMeeting}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Video className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">New Meeting</h3>
                <p className="text-sm text-muted-foreground">Start instantly</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => setIsJoinOpen(true)}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <Plus className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Join Meeting</h3>
                <p className="text-sm text-muted-foreground">Enter a code</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => setIsScheduleOpen(true)}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Calendar className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Schedule</h3>
                <p className="text-sm text-muted-foreground">Plan ahead</p>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Contacts</h3>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Meetings
            </CardTitle>
            <CardDescription>
              Your scheduled meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-medium">No upcoming meetings</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule a meeting to get started
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setIsScheduleOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{meeting.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {getDateLabel(meeting.scheduled_at)}
                          </span>
                          {meeting.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(meeting.scheduled_at), "h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(meeting.status, meeting.scheduled_at)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInvite(meeting)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Invite
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleJoinMeeting(meeting.meeting_code)}
                      >
                        Join
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleCopyLink(meeting.meeting_code)}
                          >
                            <Link className="mr-2 h-4 w-4" />
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Meetings */}
        {pastMeetings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Meetings
              </CardTitle>
              <CardDescription>
                Your meeting history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastMeetings.slice(0, 5).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{meeting.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{getDateLabel(meeting.scheduled_at)}</span>
                          {meeting.scheduled_at && (
                            <span>
                              {format(new Date(meeting.scheduled_at), "h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(meeting.status, meeting.scheduled_at)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleCopyLink(meeting.meeting_code)}
                          >
                            <Link className="mr-2 h-4 w-4" />
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <ScheduleMeetingDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        onSchedule={async (data) => {
          const { error } = await createMeeting(data);
          if (!error) {
            setIsScheduleOpen(false);
            toast({
              title: "Meeting scheduled",
              description: "Your meeting has been scheduled successfully.",
            });
          }
          return { error };
        }}
      />

      <JoinMeetingDialog
        open={isJoinOpen}
        onOpenChange={setIsJoinOpen}
        onJoin={handleJoinMeeting}
      />

      {selectedMeeting && (
        <InviteParticipantsDialog
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          meetingTitle={selectedMeeting.title}
          meetingCode={selectedMeeting.meeting_code}
          scheduledAt={selectedMeeting.scheduled_at || undefined}
          onSendInvitations={handleSendInvitations}
          isSending={invitations.isSending}
        />
      )}
    </div>
  );
}
