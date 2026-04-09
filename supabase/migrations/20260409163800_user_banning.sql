
-- Add ban support to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_by_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS banned_by_name TEXT,
ADD COLUMN IF NOT EXISTS ban_at TIMESTAMPTZ;

-- Policy to prevent banned users from sending messages
-- We will update the existing "Users can send messages" policy
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id 
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_banned = true
    )
  );

-- Policy to prevent banned users from viewing profiles (hiding names)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_banned = true
    )
    OR id = auth.uid() -- Can always see own profile
    OR public.get_user_role(auth.uid()) IN ('admin', 'developer') -- Admins/Devs can still see
  );
