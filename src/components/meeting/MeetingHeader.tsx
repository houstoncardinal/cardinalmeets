import { Shield, Copy, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ConnectionIndicator } from "./ConnectionIndicator";

interface MeetingHeaderProps {
  meetingId: string;
  meetingTitle: string;
  isRecording?: boolean;
  recordingDuration?: number;
  connectionQuality?: "excellent" | "good" | "fair" | "poor" | "disconnected";
  connectionLatency?: number;
}

export function MeetingHeader({
  meetingId,
  meetingTitle,
  isRecording = false,
  recordingDuration = 0,
  connectionQuality = "good",
  connectionLatency = 0,
}: MeetingHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    toast.success("Meeting ID copied to clipboard");
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
    <div className="flex items-center justify-between bg-meeting-card/50 px-6 py-3 backdrop-blur-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">C</span>
          </div>
          <span className="text-lg font-semibold text-meeting-text">
            Cardinal Meets
          </span>
        </div>
        <div className="h-6 w-px bg-meeting-border" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-meeting-text">
            {meetingTitle}
          </span>
          <div className="flex items-center gap-2 text-xs text-meeting-muted">
            <span>ID: {meetingId}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyMeetingId}
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

      <div className="flex items-center gap-4">
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
        <ConnectionIndicator quality={connectionQuality} latency={connectionLatency} />
        <div className="h-6 w-px bg-meeting-border" />
        <div className="flex items-center gap-2 text-meeting-muted">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-sm">End-to-end encrypted</span>
        </div>
        <div className="h-6 w-px bg-meeting-border" />
        <span className="text-sm font-medium text-meeting-text">
          {formatTime()}
        </span>
      </div>
    </div>
  );
}
