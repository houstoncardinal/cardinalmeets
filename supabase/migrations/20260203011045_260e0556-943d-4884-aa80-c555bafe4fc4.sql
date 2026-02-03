-- Create security definer function to check if user is a meeting participant
-- This avoids recursive RLS checks between meetings and meeting_participants tables
CREATE OR REPLACE FUNCTION public.is_meeting_participant(_meeting_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meeting_participants
    WHERE meeting_id = _meeting_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function to check if user is the meeting host
CREATE OR REPLACE FUNCTION public.is_meeting_host(_meeting_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meetings
    WHERE id = _meeting_id
      AND host_id = _user_id
  )
$$;

-- Drop and recreate the meetings SELECT policy using the security definer function
DROP POLICY IF EXISTS "Users can view meetings they host or participate in" ON public.meetings;

CREATE POLICY "Users can view meetings they host or participate in" 
ON public.meetings 
FOR SELECT 
USING (
  host_id = auth.uid() 
  OR public.is_meeting_participant(id, auth.uid())
);

-- Update meeting_participants policies to use security definer functions
DROP POLICY IF EXISTS "Hosts can add participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Hosts can remove participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Hosts can update participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Users can view participants of their meetings" ON public.meeting_participants;

CREATE POLICY "Hosts can add participants" 
ON public.meeting_participants 
FOR INSERT 
WITH CHECK (
  public.is_meeting_host(meeting_id, auth.uid()) 
  OR user_id = auth.uid()
);

CREATE POLICY "Hosts can remove participants" 
ON public.meeting_participants 
FOR DELETE 
USING (
  public.is_meeting_host(meeting_id, auth.uid()) 
  OR user_id = auth.uid()
);

CREATE POLICY "Hosts can update participants" 
ON public.meeting_participants 
FOR UPDATE 
USING (
  public.is_meeting_host(meeting_id, auth.uid()) 
  OR user_id = auth.uid()
);

CREATE POLICY "Users can view participants of their meetings" 
ON public.meeting_participants 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR public.is_meeting_host(meeting_id, auth.uid())
);