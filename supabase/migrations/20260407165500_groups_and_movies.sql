
-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own groups" ON public.groups
  FOR ALL USING (
    auth.uid() = teacher_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'developer')
  );

CREATE POLICY "Members can view groups" ON public.groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = public.groups.id AND user_id = auth.uid()
    )
    OR auth.uid() = teacher_id
    OR public.get_user_role(auth.uid()) IN ('admin', 'developer')
  );

-- Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage group members" ON public.group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND teacher_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('admin', 'developer')
  );

CREATE POLICY "Users can view group memberships" ON public.group_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND teacher_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('admin', 'developer')
  );

-- Movies table
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view movies" ON public.movies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers and admins can manage movies" ON public.movies
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('teacher', 'admin', 'developer')
  );

-- Update assignments table
ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Update assignments RLS to support new targets
DROP POLICY IF EXISTS "Students can view assignments for their class" ON public.assignments;

CREATE POLICY "Students can view assignments assigned to them" ON public.assignments
  FOR SELECT USING (
    (target_class IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND class_name = target_class0
    ))
    OR (target_student_id = auth.uid())
    OR (target_group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = target_group_id AND user_id = auth.uid()
    ))
  );

-- Make book_id and target_class nullable on assignments
ALTER TABLE public.assignments 
  ALTER COLUMN book_id DROP NOT NULL,
  ALTER COLUMN target_class DROP NOT NULL;

-- Add constraint to ensure either book_id or movie_id is set
ALTER TABLE public.assignments 
  ADD CONSTRAINT assignments_content_check 
  CHECK (
    (book_id IS NOT NULL AND movie_id IS NULL) OR 
    (book_id IS NULL AND movie_id IS NOT NULL)
  );

-- Add constraint to ensure at least one target is set
ALTER TABLE public.assignments 
  ADD CONSTRAINT assignments_target_check 
  CHECK (
    (target_class IS NOT NULL AND target_student_id IS NULL AND target_group_id IS NULL) OR
    (target_class IS NULL AND target_student_id IS NOT NULL AND target_group_id IS NULL) OR
    (target_class IS NULL AND target_student_id IS NULL AND target_group_id IS NOT NULL)
  );
