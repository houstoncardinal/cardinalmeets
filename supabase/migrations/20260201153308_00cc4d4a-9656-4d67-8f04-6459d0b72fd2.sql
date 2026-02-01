-- Create breakout rooms table
CREATE TABLE public.breakout_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create breakout room participants table
CREATE TABLE public.breakout_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  breakout_room_id UUID NOT NULL REFERENCES public.breakout_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(breakout_room_id, user_id)
);

-- Add waiting room status to meeting_participants
ALTER TABLE public.meeting_participants 
ADD COLUMN IF NOT EXISTS waiting_room_status TEXT DEFAULT 'admitted' CHECK (waiting_room_status IN ('waiting', 'admitted', 'rejected'));

-- Enable RLS on breakout_rooms
ALTER TABLE public.breakout_rooms ENABLE ROW LEVEL SECURITY;

-- Enable RLS on breakout_room_participants
ALTER TABLE public.breakout_room_participants ENABLE ROW LEVEL SECURITY;

-- Hosts can manage breakout rooms
CREATE POLICY "Hosts can manage breakout rooms"
ON public.breakout_rooms
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meetings 
    WHERE meetings.id = breakout_rooms.meeting_id 
    AND meetings.host_id = auth.uid()
  )
);

-- Participants can view breakout rooms in their meeting
CREATE POLICY "Participants can view breakout rooms"
ON public.breakout_rooms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meeting_participants 
    WHERE meeting_participants.meeting_id = breakout_rooms.meeting_id 
    AND meeting_participants.user_id = auth.uid()
  )
);

-- Hosts can manage breakout room participants
CREATE POLICY "Hosts can manage breakout room participants"
ON public.breakout_room_participants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM breakout_rooms
    JOIN meetings ON meetings.id = breakout_rooms.meeting_id
    WHERE breakout_rooms.id = breakout_room_participants.breakout_room_id
    AND meetings.host_id = auth.uid()
  )
);

-- Users can view and join breakout rooms they're assigned to
CREATE POLICY "Users can manage own breakout room participation"
ON public.breakout_room_participants
FOR ALL
USING (user_id = auth.uid());

-- Enable realtime for breakout rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.breakout_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.breakout_room_participants;