import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Users,
  ArrowRight,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Participant {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  isLocal?: boolean;
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: { user_id: string }[];
}

interface BreakoutRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: BreakoutRoom[];
  participants: Participant[];
  onCreateRoom: (name: string) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onAssignParticipant: (roomId: string, participantId: string) => Promise<void>;
  onRemoveParticipant: (participantId: string) => Promise<void>;
  onCloseAllRooms: () => Promise<void>;
  isHost: boolean;
}

export function BreakoutRoomsDialog({
  open,
  onOpenChange,
  rooms,
  participants,
  onCreateRoom,
  onDeleteRoom,
  onAssignParticipant,
  onRemoveParticipant,
  onCloseAllRooms,
  isHost,
}: BreakoutRoomsDialogProps) {
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateRoom(newRoomName.trim());
      setNewRoomName("");
      toast({
        title: "Room created",
        description: `Breakout room "${newRoomName}" has been created.`,
      });
    } catch {
      toast({
        title: "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    try {
      await onDeleteRoom(roomId);
      toast({
        title: "Room deleted",
        description: `Breakout room "${roomName}" has been deleted.`,
      });
    } catch {
      toast({
        title: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const handleCloseAllRooms = async () => {
    try {
      await onCloseAllRooms();
      toast({
        title: "All rooms closed",
        description: "All breakout rooms have been closed.",
      });
    } catch {
      toast({
        title: "Failed to close rooms",
        variant: "destructive",
      });
    }
  };

  // Get participants not in any room
  const unassignedParticipants = participants.filter(
    (p) => !rooms.some((r) => r.participants.some((rp) => rp.user_id === p.id))
  );

  const getParticipantById = (userId: string) => {
    return participants.find((p) => p.id === userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Breakout Rooms
          </DialogTitle>
          <DialogDescription>
            Create breakout rooms and assign participants to smaller group discussions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Left side: Unassigned participants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Unassigned ({unassignedParticipants.length})
              </Label>
            </div>
            <ScrollArea className="h-[300px] rounded-md border p-2">
              <div className="space-y-2">
                {unassignedParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between rounded-lg bg-muted p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {participant.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {participant.name}
                        {participant.isLocal && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </span>
                    </div>
                    {isHost && rooms.length > 0 && (
                      <div className="flex gap-1">
                        {rooms.slice(0, 3).map((room) => (
                          <Button
                            key={room.id}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() =>
                              onAssignParticipant(room.id, participant.id)
                            }
                            title={`Move to ${room.name}`}
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {unassignedParticipants.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    All participants are assigned
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right side: Rooms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Rooms ({rooms.length})
              </Label>
              {isHost && rooms.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseAllRooms}
                >
                  Close All
                </Button>
              )}
            </div>

            {isHost && (
              <div className="flex gap-2">
                <Input
                  placeholder="Room name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                />
                <Button
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim() || isCreating}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-lg border bg-card p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{room.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {room.participants.length}
                        </Badge>
                        {isHost && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {room.participants.map((rp) => {
                        const participant = getParticipantById(rp.user_id);
                        if (!participant) return null;
                        return (
                          <div
                            key={rp.user_id}
                            className="flex items-center gap-1 rounded-full bg-muted px-2 py-1"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={participant.avatarUrl} />
                              <AvatarFallback className="text-[10px]">
                                {participant.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{participant.name}</span>
                            {isHost && (
                              <button
                                onClick={() => onRemoveParticipant(rp.user_id)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {room.participants.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No participants yet
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No breakout rooms created yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
