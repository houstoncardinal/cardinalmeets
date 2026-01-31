import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  Phone,
  MoreHorizontal,
  Hand,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MeetingControlsProps {
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeaveMeeting: () => void;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
}

export function MeetingControls({
  onToggleChat,
  onToggleParticipants,
  onLeaveMeeting,
  isChatOpen,
  isParticipantsOpen,
}: MeetingControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const ControlButton = ({
    icon: Icon,
    label,
    onClick,
    isActive,
    variant = "default",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    variant?: "default" | "destructive" | "accent";
  }) => {
    const getButtonClasses = () => {
      if (variant === "destructive") {
        return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
      }
      if (variant === "accent" || isActive) {
        return "bg-primary hover:bg-primary/90 text-primary-foreground";
      }
      return "bg-meeting-card hover:bg-meeting-border text-meeting-text";
    };

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="lg"
            onClick={onClick}
            className={`h-12 w-12 rounded-full p-0 transition-all ${getButtonClasses()}`}
          >
            <Icon className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-meeting-card/90 px-4 py-3 backdrop-blur-lg">
      <ControlButton
        icon={isMuted ? MicOff : Mic}
        label={isMuted ? "Unmute" : "Mute"}
        onClick={() => setIsMuted(!isMuted)}
        isActive={!isMuted}
      />

      <ControlButton
        icon={isVideoOff ? VideoOff : Video}
        label={isVideoOff ? "Turn on camera" : "Turn off camera"}
        onClick={() => setIsVideoOff(!isVideoOff)}
        isActive={!isVideoOff}
      />

      <div className="mx-1 h-8 w-px bg-meeting-border" />

      <ControlButton
        icon={Monitor}
        label={isScreenSharing ? "Stop sharing" : "Share screen"}
        onClick={() => setIsScreenSharing(!isScreenSharing)}
        variant={isScreenSharing ? "accent" : "default"}
      />

      <ControlButton
        icon={Hand}
        label={isHandRaised ? "Lower hand" : "Raise hand"}
        onClick={() => setIsHandRaised(!isHandRaised)}
        variant={isHandRaised ? "accent" : "default"}
      />

      <div className="mx-1 h-8 w-px bg-meeting-border" />

      <ControlButton
        icon={Users}
        label="Participants"
        onClick={onToggleParticipants}
        variant={isParticipantsOpen ? "accent" : "default"}
      />

      <ControlButton
        icon={MessageSquare}
        label="Chat"
        onClick={onToggleChat}
        variant={isChatOpen ? "accent" : "default"}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-12 rounded-full bg-meeting-card p-0 text-meeting-text hover:bg-meeting-border"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mx-1 h-8 w-px bg-meeting-border" />

      <ControlButton
        icon={Phone}
        label="Leave meeting"
        onClick={onLeaveMeeting}
        variant="destructive"
      />
    </div>
  );
}
