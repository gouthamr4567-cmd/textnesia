CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id text NOT NULL,
  host_name text NOT NULL DEFAULT 'Host',
  host_personality text NOT NULL DEFAULT 'normal',
  guest_id text,
  guest_name text,
  guest_personality text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  sender_name text NOT NULL DEFAULT 'Anon',
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_room_id_created_at_idx ON public.messages (room_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.rooms TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;
GRANT SELECT, INSERT ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms" ON public.rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read messages" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can post messages" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_id
      AND (r.host_id = sender_id OR r.guest_id = sender_id)
  )
);

CREATE OR REPLACE FUNCTION public.join_room(_code text, _guest_id text, _guest_name text, _guest_personality text)
RETURNS public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rooms;
BEGIN
  SELECT * INTO r FROM public.rooms WHERE code = upper(_code);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROOM_NOT_FOUND';
  END IF;

  IF r.host_id = _guest_id THEN
    RETURN r;
  END IF;

  IF r.guest_id IS NOT NULL AND r.guest_id <> _guest_id THEN
    RAISE EXCEPTION 'ROOM_FULL';
  END IF;

  UPDATE public.rooms
     SET guest_id = _guest_id,
         guest_name = _guest_name,
         guest_personality = _guest_personality
   WHERE id = r.id
  RETURNING * INTO r;

  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.join_room(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_room(text, text, text, text) TO anon, authenticated;

ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;