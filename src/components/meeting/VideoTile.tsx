import { Mic, MicOff, Pin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VideoTileProps {
  name: string;
  initials: string;
  avatarUrl?: string;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isPinned?: boolean;
  isLocal?: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export function VideoTile({
  name,
  initials,
  avatarUrl,
  isMuted = false,
  isVideoOn = true,
  isPinned = false,
  isLocal = false,
  isSpeaking = false,
  className = "",
}: VideoTileProps) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-meeting-card transition-all ${
        isSpeaking ? "ring-2 ring-primary" : ""
      } ${className}`}
    >
      {isVideoOn ? (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20">
          {/* Video placeholder - in real app, this would be the video stream */}
          <div className="flex h-full w-full items-center justify-center">
            <Avatar className="h-24 w-24 border-2 border-meeting-border">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-20 w-20 border-2 border-meeting-border">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Name and status overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-meeting-bg/90 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-meeting-text">
              {name} {isLocal && "(You)"}
            </span>
            {isPinned && <Pin className="h-3 w-3 text-primary" />}
          </div>
          <div className="flex items-center gap-1">
            {isMuted ? (
              <div className="rounded-full bg-destructive/20 p-1">
                <MicOff className="h-3 w-3 text-destructive" />
              </div>
            ) : (
              <div className="rounded-full bg-primary/20 p-1">
                <Mic className="h-3 w-3 text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
