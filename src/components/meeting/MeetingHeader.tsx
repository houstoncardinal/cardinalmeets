import { Shield, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface MeetingHeaderProps {
  meetingId: string;
  meetingTitle: string;
}

export function MeetingHeader({ meetingId, meetingTitle }: MeetingHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    toast.success("Meeting ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center justify-between bg-meeting-card/50 px-6 py-3 backdrop-blur-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">M</span>
          </div>
          <span className="text-lg font-semibold text-meeting-text">
            MeetFlow
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
