-- =========================================================
-- TRACKING TAHFIDZ MAM! - FINAL PRODUCTION SCHEMA V1.0
-- Jalankan skrip ini di SQL Editor pada Supabase Dashboard
-- Skrip ini akan melakukan RESET BERSIH (menghapus tabel lama)
-- dan membuat skema yang 100% konsisten dengan kode frontend.
-- =========================================================

-- 1. DROP EXISTING TABLES (Reset Bersih untuk Skema Baru)
DROP TABLE IF EXISTS public.school_classes CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.targets CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.memorization_records CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.lesson_groups CASCADE;
DROP TABLE IF EXISTS public.private_students CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
-- (Opsional: Hapus komentar baris bawah jika ingin mereset tabel teachers juga)
-- DROP TABLE IF EXISTS public.teachers CASCADE;

-- 2. CREATE ALL TABLES

CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'guru',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_classes (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    name TEXT NOT NULL,
    homeroom_teacher TEXT,
    grade_level TEXT,
    semester TEXT,
    academic_year TEXT,
    total_students INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    class_id TEXT,
    group_id TEXT,
    nis TEXT,
    nisn TEXT,
    name TEXT NOT NULL,
    gender TEXT,
    birth_date TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    address TEXT,
    last_surah TEXT,
    last_verse TEXT,
    progress INTEGER DEFAULT 0,
    attendance TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.targets (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    semester TEXT,
    surah TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    class_id TEXT,
    entity_type TEXT,
    entity_id TEXT,
    title TEXT,
    day TEXT,
    start_time TEXT,
    end_time TEXT,
    location TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    meeting_number INTEGER,
    date TEXT NOT NULL,
    status TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    meeting_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memorization_records (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    meeting_id TEXT,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    surah_name TEXT NOT NULL,
    verse_start TEXT,
    verse_end TEXT,
    status TEXT,
    score INTEGER,
    note TEXT,
    date TEXT,
    surat_selesai BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    amount NUMERIC,
    date TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lesson_groups (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    name TEXT NOT NULL,
    day TEXT,
    time TEXT,
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.private_students (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    name TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    target TEXT,
    last_surah TEXT,
    last_verse INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.todos (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    text TEXT NOT NULL,
    done BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id TEXT NOT NULL,
    original_table TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    deleted_by TEXT NOT NULL,
    data JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE RLS (ROW LEVEL SECURITY)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. MEMBUAT POLICIES (ISOLASI DATA ANTAR GURU)
-- Guru HANYA dapat membaca, menambah, mengubah, dan menghapus data yang memiliki guru_id milik mereka.
-- Admin ('admin') dapat mengakses semua data.

CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);

DROP POLICY IF EXISTS "Teacher can view any profile" ON public.teachers;
CREATE POLICY "Teacher can view any profile" 
ON public.teachers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teacher can update own profile" ON public.teachers;
CREATE POLICY "Teacher can update own profile" 
ON public.teachers FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Guru Isolation - school_classes" ON public.school_classes FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - students" ON public.students FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - targets" ON public.targets FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - schedules" ON public.schedules FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - meetings" ON public.meetings FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - attendance_records" ON public.attendance_records FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - memorization_records" ON public.memorization_records FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - payments" ON public.payments FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - lesson_groups" ON public.lesson_groups FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - private_students" ON public.private_students FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - todos" ON public.todos FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

CREATE POLICY "Guru Isolation - audit_logs" ON public.audit_logs FOR ALL 
USING (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
)
WITH CHECK (
  (SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin' OR 
  guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text
);

-- 5. POLICIES UNTUK PARENT PORTAL (ANONYMOUS READ)
-- Portal Wali Murid hanya bisa diakses via SELECT berdasarkan class_id (dijaga oleh logika aplikasi).
CREATE POLICY "Portal Access - school_classes" ON public.school_classes FOR SELECT USING (true);
CREATE POLICY "Portal Access - students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Portal Access - attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Portal Access - memorization_records" ON public.memorization_records FOR SELECT USING (true);
CREATE POLICY "Portal Access - targets" ON public.targets FOR SELECT USING (true);
