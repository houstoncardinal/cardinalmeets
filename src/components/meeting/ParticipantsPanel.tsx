import { X, Mic, MicOff, Video, VideoOff, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface Participant {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHost?: boolean;
  isLocal?: boolean;
}

interface ParticipantsPanelProps {
  participants: Participant[];
  onClose: () => void;
}

export function ParticipantsPanel({
  participants,
  onClose,
}: ParticipantsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-80 flex-col border-l border-meeting-border bg-meeting-card">
      <div className="flex items-center justify-between border-b border-meeting-border p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-meeting-text">
            Participants
          </h3>
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {participants.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-meeting-muted hover:bg-meeting-border hover:text-meeting-text"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b border-meeting-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-meeting-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="border-meeting-border bg-meeting-bg pl-10 text-meeting-text placeholder:text-meeting-muted"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2">
          {filteredParticipants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-meeting-border/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-meeting-border">
                  <AvatarImage src={participant.avatarUrl} />
                  <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
                    {participant.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-meeting-text">
                    {participant.name}
                    {participant.isLocal && (
                      <span className="ml-1 text-meeting-muted">(You)</span>
                    )}
                  </span>
                  {participant.isHost && (
                    <span className="text-xs text-primary">Host</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div
                  className={`rounded-full p-1.5 ${
                    participant.isMuted ? "bg-destructive/20" : "bg-primary/20"
                  }`}
                >
                  {participant.isMuted ? (
                    <MicOff className="h-3 w-3 text-destructive" />
                  ) : (
                    <Mic className="h-3 w-3 text-primary" />
                  )}
                </div>
                <div
                  className={`rounded-full p-1.5 ${
                    !participant.isVideoOn
                      ? "bg-destructive/20"
                      : "bg-primary/20"
                  }`}
                >
                  {!participant.isVideoOn ? (
                    <VideoOff className="h-3 w-3 text-destructive" />
                  ) : (
                    <Video className="h-3 w-3 text-primary" />
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-meeting-muted hover:bg-meeting-border hover:text-meeting-text"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Pin</DropdownMenuItem>
                    <DropdownMenuItem>Spotlight</DropdownMenuItem>
                    {!participant.isLocal && (
                      <>
                        <DropdownMenuItem>Mute</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Remove
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-meeting-border p-4">
        <Button className="w-full" variant="outline">
          Invite participants
        </Button>
      </div>
    </div>
  );
}
