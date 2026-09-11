CREATE TABLE public.meeting_access (
  meeting_id uuid PRIMARY KEY REFERENCES public.meetings(id) ON DELETE CASCADE,
  meeting_code text NOT NULL UNIQUE,
  title text NOT NULL,
  status public.meeting_status NOT NULL,
  host_id uuid NOT NULL,
  waiting_room_enabled boolean NOT NULL DEFAULT false,
  has_password boolean NOT NULL DEFAULT false
);

GRANT SELECT ON public.meeting_access TO authenticated;
GRANT ALL ON public.meeting_access TO service_role;

ALTER TABLE public.meeting_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in sessions can resolve meeting invites"
ON public.meeting_access
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.sync_meeting_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.meeting_access WHERE meeting_id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.meeting_access (
    meeting_id,
    meeting_code,
    title,
    status,
    host_id,
    waiting_room_enabled,
    has_password
  ) VALUES (
    NEW.id,
    NEW.meeting_code,
    NEW.title,
    NEW.status,
    NEW.host_id,
    COALESCE(NEW.waiting_room_enabled, false),
    NEW.password IS NOT NULL
  )
  ON CONFLICT (meeting_id) DO UPDATE SET
    meeting_code = EXCLUDED.meeting_code,
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    host_id = EXCLUDED.host_id,
    waiting_room_enabled = EXCLUDED.waiting_room_enabled,
    has_password = EXCLUDED.has_password;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_meeting_access() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_meeting_access() TO service_role;

CREATE TRIGGER sync_meeting_access_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.sync_meeting_access();

INSERT INTO public.meeting_access (
  meeting_id,
  meeting_code,
  title,
  status,
  host_id,
  waiting_room_enabled,
  has_password
)
SELECT
  id,
  meeting_code,
  title,
  status,
  host_id,
  COALESCE(waiting_room_enabled, false),
  password IS NOT NULL
FROM public.meetings
ON CONFLICT (meeting_id) DO UPDATE SET
  meeting_code = EXCLUDED.meeting_code,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  host_id = EXCLUDED.host_id,
  waiting_room_enabled = EXCLUDED.waiting_room_enabled,
  has_password = EXCLUDED.has_password;

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
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  access_record public.meeting_access;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT ma.* INTO access_record
  FROM public.meeting_access ma
  WHERE lower(ma.meeting_code) = lower(trim(_meeting_code));

  IF access_record.meeting_id IS NULL THEN
    RETURN;
  END IF;

  IF access_record.status IN ('ended', 'cancelled') THEN
    RETURN QUERY SELECT
      access_record.meeting_id,
      access_record.meeting_code,
      access_record.title,
      access_record.status,
      access_record.host_id,
      access_record.waiting_room_enabled,
      access_record.has_password,
      access_record.host_id = auth.uid();
    RETURN;
  END IF;

  IF access_record.host_id <> auth.uid() THEN
    INSERT INTO public.meeting_participants (
      meeting_id,
      user_id,
      role,
      joined_at,
      waiting_room_status,
      invite_status
    ) VALUES (
      access_record.meeting_id,
      auth.uid(),
      'participant',
      CASE WHEN access_record.waiting_room_enabled THEN NULL ELSE now() END,
      CASE WHEN access_record.waiting_room_enabled THEN 'waiting' ELSE 'admitted' END,
      'accepted'
    )
    ON CONFLICT (meeting_id, user_id) DO UPDATE
    SET left_at = NULL,
        waiting_room_status = CASE
          WHEN public.meeting_participants.waiting_room_status = 'rejected' THEN 'rejected'
          WHEN access_record.waiting_room_enabled THEN public.meeting_participants.waiting_room_status
          ELSE 'admitted'
        END,
        joined_at = CASE
          WHEN access_record.waiting_room_enabled THEN public.meeting_participants.joined_at
          ELSE now()
        END;
  END IF;

  RETURN QUERY SELECT
    access_record.meeting_id,
    access_record.meeting_code,
    access_record.title,
    access_record.status,
    access_record.host_id,
    access_record.waiting_room_enabled,
    access_record.has_password,
    access_record.host_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.join_meeting_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_meeting_by_code(text) TO authenticated;