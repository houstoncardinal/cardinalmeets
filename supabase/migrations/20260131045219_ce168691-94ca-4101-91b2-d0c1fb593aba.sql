-- Create table for WebRTC signaling
CREATE TABLE public.signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate', 'join', 'leave')),
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.signaling ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_signaling_meeting_id ON public.signaling(meeting_id);
CREATE INDEX idx_signaling_created_at ON public.signaling(created_at);

-- Policies for signaling
CREATE POLICY "Meeting participants can view signals"
  ON public.signaling FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE id = signaling.meeting_id AND host_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.meeting_participants
      WHERE meeting_id = signaling.meeting_id AND user_id = auth.uid()
    ) OR
    sender_id = auth.uid()
  );

CREATE POLICY "Meeting participants can send signals"
  ON public.signaling FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (
        SELECT 1 FROM public.meetings
        WHERE id = meeting_id AND host_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.meeting_participants
        WHERE meeting_id = signaling.meeting_id AND user_id = auth.uid()
      )
    )
  );

-- Create table for transcriptions
CREATE TABLE public.transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  speaker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  timestamp_start FLOAT NOT NULL,
  timestamp_end FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX idx_transcriptions_meeting_id ON public.transcriptions(meeting_id);

-- Policies for transcriptions
CREATE POLICY "Meeting participants can view transcriptions"
  ON public.transcriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE id = transcriptions.meeting_id AND host_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.meeting_participants
      WHERE meeting_id = transcriptions.meeting_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Meeting participants can add transcriptions"
  ON public.transcriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = speaker_id AND (
      EXISTS (
        SELECT 1 FROM public.meetings
        WHERE id = meeting_id AND host_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.meeting_participants
        WHERE meeting_id = transcriptions.meeting_id AND user_id = auth.uid()
      )
    )
  );

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.signaling;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transcriptions;