import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Mail, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingTitle: string;
  meetingCode: string;
  scheduledAt?: string;
  onSendInvitations: (emails: string[]) => Promise<void>;
  isSending: boolean;
}

export function InviteParticipantsDialog({
  open,
  onOpenChange,
  meetingTitle,
  meetingCode,
  scheduledAt,
  onSendInvitations,
  isSending,
}: InviteParticipantsDialogProps) {
  const { toast } = useToast();
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(email)) {
      toast({
        title: "Email already added",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }

    setEmails([...emails, email]);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      toast({
        title: "No emails added",
        description: "Please add at least one email address",
        variant: "destructive",
      });
      return;
    }

    await onSendInvitations(emails);
    setEmails([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Participants</DialogTitle>
          <DialogDescription>
            Send email invitations to join "{meetingTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="participant@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addEmail}
                disabled={isSending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email List */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Recipients ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 rounded-md border border-border p-3">
                {emails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1 pl-2"
                  >
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      disabled={isSending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Meeting Info Preview */}
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">Meeting Details:</p>
            <p className="text-muted-foreground">
              Code: <span className="font-mono">{meetingCode}</span>
            </p>
            {scheduledAt && (
              <p className="text-muted-foreground">
                Scheduled:{" "}
                {new Date(scheduledAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || emails.length === 0}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send {emails.length} Invitation{emails.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
