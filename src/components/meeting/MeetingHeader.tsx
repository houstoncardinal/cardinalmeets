import { Copy, Check, Circle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { SecurityIndicator } from "./SecurityIndicator";

interface MeetingHeaderProps {
  meetingId: string;
  meetingTitle: string;
  isRecording?: boolean;
  recordingDuration?: number;
  connectionQuality?: "excellent" | "good" | "fair" | "poor" | "disconnected";
  connectionLatency?: number;
  isEncrypted?: boolean;
  hasPassword?: boolean;
  waitingRoomEnabled?: boolean;
}

export function MeetingHeader({
  meetingId,
  meetingTitle,
  isRecording = false,
  recordingDuration = 0,
  connectionQuality = "good",
  connectionLatency = 0,
  isEncrypted = true,
  hasPassword = false,
  waitingRoomEnabled = true,
}: MeetingHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 bg-meeting-card/50 px-3 py-2 backdrop-blur-lg sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">C</span>
          </div>
          <span className="text-lg font-semibold text-meeting-text">
            Cardinal Meets
          </span>
        </div>
        <div className="hidden h-6 w-px bg-meeting-border sm:block" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-meeting-text">
            {meetingTitle}
          </span>
          <div className="flex items-center gap-2 text-xs text-meeting-muted">
            <span className="truncate">{meetingId}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyInviteLink}
              className="h-5 w-5 text-meeting-muted hover:text-meeting-text"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <Button onClick={copyInviteLink} size="sm" className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Invite people"}</span>
        </Button>
        {isRecording && (
          <>
            <div className="flex items-center gap-2 rounded-full bg-destructive/20 px-3 py-1">
              <Circle className="h-3 w-3 animate-pulse fill-destructive text-destructive" />
              <span className="text-sm font-medium text-destructive">
                REC {formatDuration(recordingDuration)}
              </span>
            </div>
            <div className="h-6 w-px bg-meeting-border" />
          </>
        )}
        <div className="hidden items-center gap-4 md:flex">
          <ConnectionIndicator quality={connectionQuality} latency={connectionLatency} />
          <div className="h-6 w-px bg-meeting-border" />
          <SecurityIndicator isEncrypted={isEncrypted} hasPassword={hasPassword} waitingRoomEnabled={waitingRoomEnabled} />
          <div className="h-6 w-px bg-meeting-border" />
        </div>
        <span className="hidden text-sm font-medium text-meeting-text lg:inline">
          {formatTime()}
        </span>
      </div>
    </header>
  );
}
