import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TranscriptSegment {
  id: string;
  speakerName: string;
  text: string;
  timestamp: Date;
}

// Type declarations for Web Speech API
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useTranscription(meetingId: string, isActive: boolean) {
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptBufferRef = useRef<string>("");

  const createSpeechRecognition = useCallback((): SpeechRecognitionInstance | null => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return null;
    return new SpeechRecognitionClass();
  }, []);

  const processTranscription = useCallback(
    async (text: string, speakerName: string) => {
      if (!text.trim()) return;

      const segment: TranscriptSegment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        speakerName,
        text: text.trim(),
        timestamp: new Date(),
      };

      setTranscripts((prev) => [...prev, segment]);
    },
    []
  );

  const startTranscription = useCallback(
    async (stream: MediaStream, speakerName: string) => {
      const recognition = createSpeechRecognition();

      if (!recognition) {
        setError("Speech recognition is not supported in this browser");
        return;
      }

      try {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          console.log("Speech recognition started");
          setIsTranscribing(true);
          setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            processTranscription(finalTranscript, speakerName);
          }

          transcriptBufferRef.current = interimTranscript;
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "no-speech") {
            return;
          }
          setError(`Speech recognition error: ${event.error}`);
        };

        recognition.onend = () => {
          console.log("Speech recognition ended");
          if (isActive && recognitionRef.current) {
            try {
              recognition.start();
            } catch (err) {
              console.error("Error restarting recognition:", err);
            }
          } else {
            setIsTranscribing(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Error starting transcription:", err);
        setError("Failed to start transcription");
      }
    },
    [isActive, processTranscription, createSpeechRecognition]
  );

  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    transcriptBufferRef.current = "";
  }, []);

  useEffect(() => {
    if (!meetingId || !isActive) return;

    const getMeetingUuid = async () => {
      const { data: meeting } = await supabase
        .from("meetings")
        .select("id")
        .eq("meeting_code", meetingId)
        .single();

      if (!meeting) return null;
      return meeting.id;
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;

    getMeetingUuid().then((uuid) => {
      if (!uuid) return;

      channel = supabase
        .channel(`transcriptions:${uuid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transcriptions",
            filter: `meeting_id=eq.${uuid}`,
          },
          (payload) => {
            const transcription = payload.new as {
              id: string;
              content: string;
              speaker_id: string;
              created_at: string;
            };

            setTranscripts((prev) => [
              ...prev,
              {
                id: transcription.id,
                speakerName: "Participant",
                text: transcription.content,
                timestamp: new Date(transcription.created_at),
              },
            ]);
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [meetingId, isActive]);

  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, [stopTranscription]);

  return {
    transcripts,
    isTranscribing,
    error,
    startTranscription,
    stopTranscription,
    clearTranscripts,
  };
}
