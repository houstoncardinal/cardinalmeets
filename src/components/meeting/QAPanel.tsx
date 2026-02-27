import { useState } from "react";
import { X, Send, ThumbsUp, Pin, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuestions } from "@/hooks/useQuestions";

interface QAPanelProps {
  meetingId: string;
  isHost: boolean;
  onClose: () => void;
}

export function QAPanel({ meetingId, isHost, onClose }: QAPanelProps) {
  const { questions, askQuestion, answerQuestion, toggleUpvote, pinQuestion } = useQuestions(meetingId);
  const [newQuestion, setNewQuestion] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  const handleAsk = async () => {
    if (!newQuestion.trim()) return;
    await askQuestion(newQuestion);
    setNewQuestion("");
  };

  const handleAnswer = async (id: string) => {
    if (!answerText.trim()) return;
    await answerQuestion(id, answerText);
    setAnsweringId(null);
    setAnswerText("");
  };

  const pinned = questions.filter((q) => q.is_pinned);
  const unanswered = questions.filter((q) => !q.is_answered && !q.is_pinned);
  const answered = questions.filter((q) => q.is_answered && !q.is_pinned);

  const QuestionItem = ({ q }: { q: typeof questions[0] }) => (
    <div className="rounded-lg border border-meeting-border bg-meeting-bg p-3 space-y-2">
      <div className="flex items-start gap-2">
        {q.is_pinned && <Pin className="h-3 w-3 text-primary mt-1 shrink-0" />}
        <p className="text-sm text-meeting-text flex-1">{q.question}</p>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${q.hasUpvoted ? "text-primary" : "text-meeting-text-muted"}`}
            onClick={() => toggleUpvote(q.id, q.hasUpvoted)}
          >
            <ThumbsUp className="h-3 w-3" />
          </Button>
          <span className="text-xs text-meeting-text-muted">{q.upvotes}</span>
        </div>
      </div>
      {q.is_answered && q.answer && (
        <div className="flex items-start gap-2 bg-primary/5 rounded p-2">
          <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-meeting-text">{q.answer}</p>
        </div>
      )}
      {isHost && !q.is_answered && (
        <div className="flex gap-1">
          {answeringId === q.id ? (
            <div className="w-full space-y-2">
              <Textarea
                placeholder="Type your answer..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="bg-meeting-card border-meeting-border text-meeting-text text-xs min-h-[60px]"
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={() => handleAnswer(q.id)}>Answer</Button>
                <Button size="sm" variant="ghost" onClick={() => setAnsweringId(null)} className="text-meeting-text-muted">Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setAnsweringId(q.id)} className="text-primary text-xs">
                Answer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => pinQuestion(q.id, q.is_pinned)} className="text-meeting-text-muted text-xs">
                {q.is_pinned ? "Unpin" : "Pin"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full w-80 flex-col border-l border-meeting-border bg-meeting-card">
      <div className="flex items-center justify-between border-b border-meeting-border p-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-meeting-text">Q&A</h3>
          <span className="text-xs text-meeting-text-muted">({questions.length})</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-meeting-text-muted">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {pinned.length > 0 && (
            <>
              <p className="text-xs font-medium text-primary">Pinned</p>
              {pinned.map((q) => <QuestionItem key={q.id} q={q} />)}
            </>
          )}
          {unanswered.length > 0 && (
            <>
              <p className="text-xs font-medium text-meeting-text-muted">Unanswered</p>
              {unanswered.map((q) => <QuestionItem key={q.id} q={q} />)}
            </>
          )}
          {answered.length > 0 && (
            <>
              <p className="text-xs font-medium text-meeting-text-muted">Answered</p>
              {answered.map((q) => <QuestionItem key={q.id} q={q} />)}
            </>
          )}
          {questions.length === 0 && (
            <p className="text-center text-sm text-meeting-text-muted py-8">No questions yet</p>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-meeting-border p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            className="bg-meeting-bg border-meeting-border text-meeting-text"
          />
          <Button size="icon" onClick={handleAsk} disabled={!newQuestion.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
