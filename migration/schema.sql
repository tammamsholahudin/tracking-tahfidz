-- =========================================================
-- TRACKING TAHFIDZ MAM! - SECURE PRODUCTION SCHEMA V2.0
-- Jalankan skrip ini di SQL Editor pada Supabase Dashboard
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
    institution_name TEXT,
    institution_subtitle TEXT,
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

-- =========================================================
-- 4. RLS HELPER FUNCTIONS
-- Optimization to prevent multiple expensive subqueries
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.teachers WHERE user_id = auth.uid() LIMIT 1) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_guru_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1)::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);

-- =========================================================
-- 5. RLS POLICIES FOR TEACHERS
-- Protected from anonymous users to prevent contact details leak
-- =========================================================
DROP POLICY IF EXISTS "Teacher can view any profile" ON public.teachers;
CREATE POLICY "Teacher can view any profile" 
ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teacher can update own profile" ON public.teachers;
CREATE POLICY "Teacher can update own profile" 
ON public.teachers FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admin can insert teacher profile" ON public.teachers;
CREATE POLICY "Admin can insert teacher profile" 
ON public.teachers FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update any teacher profile" ON public.teachers;
CREATE POLICY "Admin can update any teacher profile" 
ON public.teachers FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete teacher profile" ON public.teachers;
CREATE POLICY "Admin can delete teacher profile" 
ON public.teachers FOR DELETE USING (public.is_admin());

-- =========================================================
-- 6. RLS POLICIES FOR INTERNAL TABLES 
-- Strictly Owner or Admin Only (No Public Access)
-- Tables: schedules, meetings, payments, lesson_groups, private_students, todos, audit_logs
-- =========================================================

-- schedules
CREATE POLICY "Guru/Admin can select schedules" ON public.schedules FOR SELECT USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can insert schedules" ON public.schedules FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update schedules" ON public.schedules FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete schedules" ON public.schedules FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- meetings
CREATE POLICY "Guru/Admin can select meetings" ON public.meetings FOR SELECT USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can insert meetings" ON public.meetings FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update meetings" ON public.meetings FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete meetings" ON public.meetings FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- payments
CREATE POLICY "Guru/Admin can select payments" ON public.payments FOR SELECT USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can insert payments" ON public.payments FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update payments" ON public.payments FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete payments" ON public.payments FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- lesson_groups
CREATE POLICY "Guru/Admin can select lesson_groups" ON public.lesson_groups FOR SELECT USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can insert lesson_groups" ON public.lesson_groups FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update lesson_groups" ON public.lesson_groups FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete lesson_groups" ON public.lesson_groups FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- private_students
CREATE POLICY "Guru/Admin can select private_students" ON public.private_students FOR SELECT USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can insert private_students" ON public.private_students FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update private_students" ON public.private_students FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete private_students" ON public.private_students FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- todos
CREATE POLICY "Guru/Admin can select todos" ON public.todos FOR SELECT USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can insert todos" ON public.todos FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update todos" ON public.todos FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete todos" ON public.todos FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- audit_logs
CREATE POLICY "Guru/Admin can select audit_logs" ON public.audit_logs FOR SELECT USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update audit_logs" ON public.audit_logs FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete audit_logs" ON public.audit_logs FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- =========================================================
-- 7. RLS POLICIES FOR PARENT PORTAL TABLES
-- PUBLIC SELECT allowed (so parents can view data without login)
-- INSERT, UPDATE, DELETE strictly restricted to Owner or Admin
-- Tables: school_classes, students, targets, attendance_records, memorization_records
-- =========================================================

-- school_classes
CREATE POLICY "Public can read school_classes" ON public.school_classes FOR SELECT USING (true);
CREATE POLICY "Guru/Admin can insert school_classes" ON public.school_classes FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update school_classes" ON public.school_classes FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete school_classes" ON public.school_classes FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- students
CREATE POLICY "Public can read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Guru/Admin can insert students" ON public.students FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update students" ON public.students FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete students" ON public.students FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- targets
CREATE POLICY "Public can read targets" ON public.targets FOR SELECT USING (true);
CREATE POLICY "Guru/Admin can insert targets" ON public.targets FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update targets" ON public.targets FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete targets" ON public.targets FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- attendance_records
CREATE POLICY "Public can read attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Guru/Admin can insert attendance_records" ON public.attendance_records FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update attendance_records" ON public.attendance_records FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete attendance_records" ON public.attendance_records FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());

-- memorization_records
CREATE POLICY "Public can read memorization_records" ON public.memorization_records FOR SELECT USING (true);
CREATE POLICY "Guru/Admin can insert memorization_records" ON public.memorization_records FOR INSERT WITH CHECK (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can update memorization_records" ON public.memorization_records FOR UPDATE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
CREATE POLICY "Guru/Admin can delete memorization_records" ON public.memorization_records FOR DELETE USING (guru_id = public.get_my_guru_id() OR public.is_admin());
