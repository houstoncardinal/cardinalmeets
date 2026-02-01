import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WaitingScreenProps {
  meetingTitle?: string;
  onLeave: () => void;
}

export function WaitingScreen({ meetingTitle, onLeave }: WaitingScreenProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-meeting-bg">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-meeting-card flex items-center justify-center">
            <Clock className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-meeting-text">
            Waiting to be admitted
          </h1>
          {meetingTitle && (
            <p className="text-meeting-text-muted">
              Meeting: {meetingTitle}
            </p>
          )}
          <p className="text-sm text-meeting-text-muted max-w-md">
            The host will let you in soon. Please wait while they review your request to join.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onLeave}
          className="mt-8"
        >
          Leave waiting room
        </Button>
      </div>
    </div>
  );
}
