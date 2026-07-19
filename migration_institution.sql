-- Buka SQL Editor di Supabase Dashboard, lalu jalankan perintah di bawah ini:

ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS institution_subtitle TEXT;
