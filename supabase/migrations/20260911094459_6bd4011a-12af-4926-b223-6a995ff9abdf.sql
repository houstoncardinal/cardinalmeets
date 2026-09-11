CREATE OR REPLACE FUNCTION public.create_instant_meeting(_title text DEFAULT 'Instant Meeting')
RETURNS public.meetings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  created_meeting public.meetings;
  candidate_code text;
BEGIN
  IF auth.uid() IS NULL OR COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) THEN
    RAISE EXCEPTION 'A full account is required to host a meeting';
  END IF;

  LOOP
    candidate_code := public.generate_meeting_code();
    BEGIN
      INSERT INTO public.meetings (
        meeting_code,
        title,
        host_id,
        status,
        waiting_room_enabled
      ) VALUES (
        candidate_code,
        COALESCE(NULLIF(trim(_title), ''), 'Instant Meeting'),
        auth.uid(),
        'active',
        false
      )
      RETURNING * INTO created_meeting;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;

  RETURN created_meeting;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_instant_meeting(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_meeting_by_code(_meeting_code text)
RETURNS TABLE (
  id uuid,
  meeting_code text,
  title text,
  status public.meeting_status,
  host_id uuid,
  waiting_room_enabled boolean,
  has_password boolean,
  is_host boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_meeting public.meetings;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT m.* INTO target_meeting
  FROM public.meetings m
  WHERE lower(m.meeting_code) = lower(trim(_meeting_code));

  IF target_meeting.id IS NULL THEN
    RETURN;
  END IF;

  IF target_meeting.status IN ('ended', 'cancelled') AND target_meeting.host_id <> auth.uid() THEN
    RETURN QUERY SELECT
      target_meeting.id,
      target_meeting.meeting_code,
      target_meeting.title,
      target_meeting.status,
      target_meeting.host_id,
      target_meeting.waiting_room_enabled,
      target_meeting.password IS NOT NULL,
      false;
    RETURN;
  END IF;

  IF target_meeting.host_id <> auth.uid() THEN
    INSERT INTO public.meeting_participants (
      meeting_id,
      user_id,
      role,
      joined_at,
      waiting_room_status,
      invite_status
    ) VALUES (
      target_meeting.id,
      auth.uid(),
      'participant',
      CASE WHEN target_meeting.waiting_room_enabled THEN NULL ELSE now() END,
      CASE WHEN target_meeting.waiting_room_enabled THEN 'waiting' ELSE 'admitted' END,
      'accepted'
    )
    ON CONFLICT (meeting_id, user_id) DO UPDATE
    SET left_at = NULL,
        waiting_room_status = CASE
          WHEN public.meeting_participants.waiting_room_status = 'rejected' THEN 'rejected'
          WHEN target_meeting.waiting_room_enabled THEN public.meeting_participants.waiting_room_status
          ELSE 'admitted'
        END,
        joined_at = CASE
          WHEN target_meeting.waiting_room_enabled THEN public.meeting_participants.joined_at
          ELSE now()
        END;
  END IF;

  RETURN QUERY SELECT
    target_meeting.id,
    target_meeting.meeting_code,
    target_meeting.title,
    target_meeting.status,
    target_meeting.host_id,
    target_meeting.waiting_room_enabled,
    target_meeting.password IS NOT NULL,
    target_meeting.host_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.join_meeting_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_meeting_by_code(text) TO authenticated;