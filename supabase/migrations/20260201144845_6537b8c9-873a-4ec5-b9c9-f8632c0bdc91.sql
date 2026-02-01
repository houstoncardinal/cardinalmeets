-- Create meeting_recordings table
CREATE TABLE public.meeting_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting_summaries table
CREATE TABLE public.meeting_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE UNIQUE,
  summary TEXT NOT NULL,
  key_points JSONB NOT NULL DEFAULT '[]',
  action_items JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting_invitations table
CREATE TABLE public.meeting_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'declined')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

-- RLS for meeting_recordings
CREATE POLICY "Participants can view meeting recordings"
  ON public.meeting_recordings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_recordings.meeting_id AND meetings.host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM meeting_participants WHERE meeting_participants.meeting_id = meeting_recordings.meeting_id AND meeting_participants.user_id = auth.uid())
  );

CREATE POLICY "Hosts can create meeting recordings"
  ON public.meeting_recordings FOR INSERT
  WITH CHECK (
    auth.uid() = recorded_by
    AND EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_recordings.meeting_id AND meetings.host_id = auth.uid())
  );

-- RLS for meeting_summaries
CREATE POLICY "Participants can view meeting summaries"
  ON public.meeting_summaries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_summaries.meeting_id AND meetings.host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM meeting_participants WHERE meeting_participants.meeting_id = meeting_summaries.meeting_id AND meeting_participants.user_id = auth.uid())
  );

CREATE POLICY "Service can create meeting summaries"
  ON public.meeting_summaries FOR INSERT
  WITH CHECK (true);

-- RLS for meeting_invitations
CREATE POLICY "Hosts can manage invitations"
  ON public.meeting_invitations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_invitations.meeting_id AND meetings.host_id = auth.uid())
  );

CREATE POLICY "Invitees can view their invitations"
  ON public.meeting_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );