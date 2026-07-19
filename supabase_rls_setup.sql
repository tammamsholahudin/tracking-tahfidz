-- =========================================================
-- SCRIPT SETUP FULL SCHEMA & SUPABASE AUTH & ROW LEVEL SECURITY (RLS)
-- Untuk Tracking Tahfidz MAM!
-- Jalankan skrip ini di SQL Editor pada Supabase Dashboard
-- =========================================================

-- =========================================================
-- 1. CREATE ALL TABLES
-- =========================================================

-- Drop existing tables (except teachers which might contain auth links) to ensure clean schema
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

CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
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
    name TEXT NOT NULL,
    guru_id TEXT NOT NULL,
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
    class_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    nis TEXT,
    name TEXT NOT NULL,
    gender TEXT,
    last_surah TEXT,
    last_verse TEXT,
    progress INTEGER DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.targets (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    semester TEXT,
    surah TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    meeting_number INTEGER,
    date TEXT NOT NULL,
    status TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memorization_records (
    id TEXT PRIMARY KEY,
    meeting_id TEXT,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
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
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    amount NUMERIC,
    date TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lesson_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    day TEXT,
    time TEXT,
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.private_students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    target TEXT,
    last_surah TEXT,
    last_verse INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_table TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    deleted_by TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    data JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- 2. ENABLE RLS (ROW LEVEL SECURITY)
-- =========================================================

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
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. MEMBUAT POLICIES (ATURAN HAK AKSES)
-- =========================================================
-- Aturan Umum: Guru hanya bisa CRUD data miliknya sendiri (guru_id = string dari auth.uid() atau user_id-nya)

-- TEACHERS: Guru bisa membaca profil semua (diperlukan untuk fungsi assignment dll)
CREATE POLICY "Teacher can view any profile" 
ON public.teachers FOR SELECT 
USING (true);

CREATE POLICY "Teacher can update own profile" 
ON public.teachers FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admin can insert teacher profile" 
ON public.teachers FOR INSERT 
WITH CHECK ((SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "Admin can update any teacher profile" 
ON public.teachers FOR UPDATE 
USING ((SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "Admin can delete teacher profile" 
ON public.teachers FOR DELETE 
USING ((SELECT role FROM teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin');

-- CLASSES
CREATE POLICY "Guru can CRUD own classes" 
ON public.school_classes FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- STUDENTS
CREATE POLICY "Guru can CRUD own students" 
ON public.students FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- MEETINGS
CREATE POLICY "Guru can CRUD own meetings" 
ON public.meetings FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- ATTENDANCE
CREATE POLICY "Guru can CRUD own attendance" 
ON public.attendance_records FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- MEMORIZATION
CREATE POLICY "Guru can CRUD own memorization" 
ON public.memorization_records FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- TARGETS
CREATE POLICY "Guru can CRUD own targets" 
ON public.targets FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- SCHEDULES
CREATE POLICY "Guru can CRUD own schedules" 
ON public.schedules FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- PAYMENTS
CREATE POLICY "Guru can CRUD own payments" 
ON public.payments FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- AUDIT LOGS
CREATE POLICY "Guru can CRUD own audit logs" 
ON public.audit_logs FOR ALL 
USING (guru_id = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)::text);

-- =========================================================
-- 4. POLICIES UNTUK PARENT PORTAL (ANONYMOUS READ)
-- =========================================================

CREATE POLICY "Public can read classes" 
ON public.school_classes FOR SELECT 
USING (true);

CREATE POLICY "Public can read students" 
ON public.students FOR SELECT 
USING (true);

CREATE POLICY "Public can read attendance" 
ON public.attendance_records FOR SELECT 
USING (true);

CREATE POLICY "Public can read memorizations" 
ON public.memorization_records FOR SELECT 
USING (true);

CREATE POLICY "Public can read targets" 
ON public.targets FOR SELECT 
USING (true);
