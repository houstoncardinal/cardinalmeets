import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, Clock, Users } from "lucide-react";

interface WaitingParticipant {
  id: string;
  user_id: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface WaitingRoomPanelProps {
  waitingParticipants: WaitingParticipant[];
  isWaitingRoomEnabled: boolean;
  onAdmit: (participantId: string) => Promise<void>;
  onReject: (participantId: string) => Promise<void>;
  onAdmitAll: () => Promise<void>;
  onToggleWaitingRoom: (enabled: boolean) => Promise<void>;
  onClose: () => void;
}

export function WaitingRoomPanel({
  waitingParticipants,
  isWaitingRoomEnabled,
  onAdmit,
  onReject,
  onAdmitAll,
  onToggleWaitingRoom,
  onClose,
}: WaitingRoomPanelProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-meeting-border bg-meeting-card">
      <div className="flex items-center justify-between border-b border-meeting-border p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-meeting-text-muted" />
          <h3 className="font-semibold text-meeting-text">Waiting Room</h3>
          {waitingParticipants.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {waitingParticipants.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-meeting-text-muted hover:text-meeting-text"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between border-b border-meeting-border p-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="waiting-room-toggle" className="text-meeting-text text-sm">
            Enable Waiting Room
          </Label>
        </div>
        <Switch
          id="waiting-room-toggle"
          checked={isWaitingRoomEnabled}
          onCheckedChange={onToggleWaitingRoom}
        />
      </div>

      <ScrollArea className="flex-1 p-4">
        {!isWaitingRoomEnabled ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-meeting-text-muted mb-4" />
            <p className="text-sm text-meeting-text-muted">
              Waiting room is disabled.
              <br />
              Participants will join directly.
            </p>
          </div>
        ) : waitingParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-meeting-text-muted mb-4" />
            <p className="text-sm text-meeting-text-muted">
              No one is waiting to join.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between rounded-lg bg-meeting-bg p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(participant.profile?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-meeting-text">
                      {participant.profile?.full_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-meeting-text-muted">
                      Waiting to join...
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => onReject(participant.id)}
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                    onClick={() => onAdmit(participant.id)}
                    title="Admit"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {waitingParticipants.length > 0 && (
        <div className="border-t border-meeting-border p-4">
          <Button
            onClick={onAdmitAll}
            className="w-full"
            variant="outline"
          >
            <Users className="mr-2 h-4 w-4" />
            Admit All ({waitingParticipants.length})
          </Button>
        </div>
      )}
    </div>
  );
}
