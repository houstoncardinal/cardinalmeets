-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can create meeting summaries" ON public.meeting_summaries;

-- Create proper policy - summaries are inserted via service role key in edge functions
-- No INSERT policy needed since edge functions use service role which bypasses RLS