-- Fix the generate_meeting_code function to set search_path
CREATE OR REPLACE FUNCTION public.generate_meeting_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * 26 + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * 26 + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * 26 + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;