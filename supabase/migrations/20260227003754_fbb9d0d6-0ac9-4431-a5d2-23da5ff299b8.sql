
-- Polls table
CREATE TABLE public.meeting_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.meeting_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage polls" ON public.meeting_polls FOR ALL
  USING (is_meeting_host(meeting_id, auth.uid()));

CREATE POLICY "Participants can view polls" ON public.meeting_polls FOR SELECT
  USING (is_meeting_participant(meeting_id, auth.uid()) OR is_meeting_host(meeting_id, auth.uid()));

-- Poll votes table
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.meeting_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id, option_index)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view votes" ON public.poll_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meeting_polls mp
    WHERE mp.id = poll_votes.poll_id
    AND (is_meeting_host(mp.meeting_id, auth.uid()) OR is_meeting_participant(mp.meeting_id, auth.uid()))
  ));

-- Q&A table
CREATE TABLE public.meeting_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  asked_by UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ
);

ALTER TABLE public.meeting_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can ask questions" ON public.meeting_questions FOR INSERT
  WITH CHECK (auth.uid() = asked_by AND (is_meeting_participant(meeting_id, auth.uid()) OR is_meeting_host(meeting_id, auth.uid())));

CREATE POLICY "Participants can view questions" ON public.meeting_questions FOR SELECT
  USING (is_meeting_participant(meeting_id, auth.uid()) OR is_meeting_host(meeting_id, auth.uid()));

CREATE POLICY "Hosts can manage questions" ON public.meeting_questions FOR UPDATE
  USING (is_meeting_host(meeting_id, auth.uid()));

-- Question upvotes
CREATE TABLE public.question_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.meeting_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

ALTER TABLE public.question_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upvote" ON public.question_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove upvote" ON public.question_upvotes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view upvotes" ON public.question_upvotes FOR SELECT
  USING (true);

-- Meeting analytics
CREATE TABLE public.meeting_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  total_talk_time_seconds INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  hand_raises_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

ALTER TABLE public.meeting_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view analytics" ON public.meeting_analytics FOR SELECT
  USING (is_meeting_host(meeting_id, auth.uid()));

CREATE POLICY "Users can insert own analytics" ON public.meeting_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON public.meeting_analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- Reactions table
CREATE TABLE public.meeting_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can send reactions" ON public.meeting_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND (is_meeting_participant(meeting_id, auth.uid()) OR is_meeting_host(meeting_id, auth.uid())));

CREATE POLICY "Participants can view reactions" ON public.meeting_reactions FOR SELECT
  USING (is_meeting_participant(meeting_id, auth.uid()) OR is_meeting_host(meeting_id, auth.uid()));

-- Enable realtime for polls, questions, reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_reactions;
