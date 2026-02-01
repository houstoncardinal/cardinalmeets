import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MeetingSummary {
  id: string;
  summary: string;
  key_points: string[];
  action_items: string[];
  generated_at: string;
}

interface MeetingSummaryPanelProps {
  meetingId: string;
  onClose: () => void;
}

export function MeetingSummaryPanel({
  meetingId,
  onClose,
}: MeetingSummaryPanelProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [meetingId]);

  const fetchSummary = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("meeting_summaries")
      .select("*")
      .eq("meeting_id", meetingId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching summary:", error);
    } else if (data) {
      setSummary(data as unknown as MeetingSummary);
    }
    setIsLoading(false);
  };

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-meeting-summary",
        {
          body: { meetingId },
        }
      );

      if (error) throw error;

      setSummary(data as MeetingSummary);
      toast({
        title: "Summary generated",
        description: "Your meeting summary is ready",
      });
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast({
        title: "Failed to generate summary",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-meeting-border bg-meeting-card">
      <div className="flex items-center justify-between border-b border-meeting-border p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-meeting-text">Meeting Summary</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-meeting-muted hover:text-meeting-text"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* Summary Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-meeting-text">
                <FileText className="h-4 w-4 text-primary" />
                Summary
              </div>
              <p className="text-sm leading-relaxed text-meeting-muted">
                {summary.summary}
              </p>
            </div>

            {/* Key Points */}
            {summary.key_points.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-meeting-text">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Key Points
                </div>
                <ul className="space-y-2">
                  {summary.key_points.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-meeting-muted"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summary.action_items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-meeting-text">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Action Items
                </div>
                <ul className="space-y-2">
                  {summary.action_items.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 rounded-lg bg-meeting-bg p-2 text-sm text-meeting-muted"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-meeting-muted" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-meeting-muted">
              Generated{" "}
              {new Date(summary.generated_at).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="mb-4 h-12 w-12 text-meeting-muted" />
            <h3 className="mb-2 text-lg font-medium text-meeting-text">
              No Summary Yet
            </h3>
            <p className="mb-6 text-sm text-meeting-muted">
              Generate an AI-powered summary of this meeting's key points and
              action items.
            </p>
            <Button
              onClick={generateSummary}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate Summary
            </Button>
          </div>
        )}
      </ScrollArea>

      {summary && (
        <div className="border-t border-meeting-border p-4">
          <Button
            variant="outline"
            onClick={generateSummary}
            disabled={isGenerating}
            className="w-full gap-2 border-meeting-border text-meeting-text hover:bg-meeting-border"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Regenerate Summary
          </Button>
        </div>
      )}
    </div>
  );
}
