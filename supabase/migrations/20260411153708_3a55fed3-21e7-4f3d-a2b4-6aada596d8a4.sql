
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS line_user_id text UNIQUE,
ADD COLUMN IF NOT EXISTS line_display_name text,
ADD COLUMN IF NOT EXISTS line_picture_url text;

CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON public.profiles (line_user_id);
