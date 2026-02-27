import { useState } from "react";
import { X, Plus, BarChart3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Poll, usePolls } from "@/hooks/usePolls";

interface PollsPanelProps {
  meetingId: string;
  isHost: boolean;
  onClose: () => void;
}

export function PollsPanel({ meetingId, isHost, onClose }: PollsPanelProps) {
  const { polls, createPoll, vote, endPoll } = usePolls(meetingId);
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleCreate = async () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    await createPoll(question, validOptions, isAnonymous);
    setQuestion("");
    setOptions(["", ""]);
    setIsCreating(false);
  };

  const totalVotes = (poll: Poll) =>
    poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="flex h-full w-80 flex-col border-l border-meeting-border bg-meeting-card">
      <div className="flex items-center justify-between border-b border-meeting-border p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-meeting-text">Polls</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-meeting-text-muted">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isCreating ? (
          <div className="space-y-3">
            <Input
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="bg-meeting-bg border-meeting-border text-meeting-text"
            />
            {options.map((opt, i) => (
              <Input
                key={i}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
                className="bg-meeting-bg border-meeting-border text-meeting-text"
              />
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOptions([...options, ""])}
              className="text-primary"
            >
              <Plus className="mr-1 h-3 w-3" /> Add option
            </Button>
            <div className="flex items-center gap-2">
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label className="text-meeting-text-muted text-sm">Anonymous</Label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate}>Launch Poll</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)} className="text-meeting-text-muted">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isHost && (
              <Button onClick={() => setIsCreating(true)} className="mb-4 w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Create Poll
              </Button>
            )}
            <div className="space-y-4">
              {polls.map((poll) => (
                <div key={poll.id} className="rounded-lg border border-meeting-border bg-meeting-bg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-meeting-text">{poll.question}</p>
                    {!poll.is_active && (
                      <span className="text-xs text-meeting-text-muted bg-meeting-border px-2 py-0.5 rounded">Ended</span>
                    )}
                  </div>
                  {poll.options.map((opt, i) => {
                    const total = totalVotes(poll);
                    const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                    const hasVoted = poll.myVotes.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => poll.is_active && !hasVoted && vote(poll.id, i)}
                        disabled={!poll.is_active || hasVoted}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between text-xs text-meeting-text mb-1">
                          <span className="flex items-center gap-1">
                            {hasVoted && <Check className="h-3 w-3 text-primary" />}
                            {opt.text}
                          </span>
                          <span className="text-meeting-text-muted">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </button>
                    );
                  })}
                  <p className="text-xs text-meeting-text-muted">{totalVotes(poll)} votes</p>
                  {isHost && poll.is_active && (
                    <Button size="sm" variant="ghost" onClick={() => endPoll(poll.id)} className="text-destructive">
                      End Poll
                    </Button>
                  )}
                </div>
              ))}
              {polls.length === 0 && (
                <p className="text-center text-sm text-meeting-text-muted py-8">No polls yet</p>
              )}
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
