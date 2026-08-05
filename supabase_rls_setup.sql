-- =========================================================
-- SAFE RLS MIGRATION SCRIPT FOR TAHFIDZ MAM
-- =========================================================
-- Skrip ini TIDAK AKAN menghapus tabel (NO DROP TABLE)
-- dan hanya akan MENGAKTIFKAN RLS (Row Level Security)
-- beserta kebijakan akses (Policies) yang sesuai dengan Role.

-- 1. Mengaktifkan RLS pada semua tabel
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

-- 2. Hapus policies yang mungkin sudah ada (agar tidak bentrok)
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 3. Membuat Fungsi Pembantu untuk mengecek Role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_teacher_id()
RETURNS TEXT AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Membuat Policies untuk setiap tabel

-- =========================================================
-- TEACHERS (Guru & Admin & Wali Kelas)
-- =========================================================
-- Admin bisa melihat & mengedit semua guru
-- Guru & Wali Kelas hanya bisa melihat semua guru (untuk kebutuhan referensi) tapi hanya bisa mengedit dirinya sendiri
CREATE POLICY "Admin dapat mengelola semua data guru" ON public.teachers
  FOR ALL USING (public.get_auth_role() = 'admin');

CREATE POLICY "Semua user bisa melihat data guru" ON public.teachers
  FOR SELECT USING (true);

CREATE POLICY "Guru hanya dapat mengupdate profilnya sendiri" ON public.teachers
  FOR UPDATE USING (user_id = auth.uid());

-- =========================================================
-- MACRO POLICIES (BERLAKU UNTUK SEMUA TABEL DATA)
-- =========================================================
-- Definisi Akses:
-- 1. Admin -> FULL ACCESS (ALL)
-- 2. Guru -> FULL ACCESS (ALL) TAPI hanya untuk record dimana guru_id = id_milik_guru
-- 3. Wali Kelas -> READ ONLY (SELECT) TAPI hanya untuk record dimana class_id = kelas_yang_diwali (Untuk simplifikasi, jika tidak ada relasi langsung, Wali Kelas diberikan read-only ke semua data atau disamakan dengan guru_id tertentu jika relevan, disini diasumsikan wali kelas read-only semua kelas karena di front-end sudah difilter)

-- Membuat Macro Policy Generator untuk tabel-tabel yang punya kolom guru_id
DO $$
DECLARE
  t TEXT;
  tables_with_guru_id TEXT[] := ARRAY[
    'school_classes', 'students', 'targets', 'schedules', 
    'meetings', 'attendance_records', 'memorization_records', 
    'payments', 'lesson_groups', 'private_students', 'audit_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables_with_guru_id LOOP
    
    -- ADMIN: Full Access
    EXECUTE format('
      CREATE POLICY "Admin All Access %s" ON public.%s 
      FOR ALL USING (public.get_auth_role() = ''admin'')
    ', t, t);

    -- GURU: Full Access untuk data miliknya (guru_id)
    EXECUTE format('
      CREATE POLICY "Guru All Access Own Data %s" ON public.%s 
      FOR ALL USING (
        public.get_auth_role() = ''guru'' 
        AND guru_id = public.get_auth_teacher_id()
      )
    ', t, t);

    -- WALI KELAS: Read-Only Access untuk semua data (dibatasi di frontend jika perlu)
    EXECUTE format('
      CREATE POLICY "Wali Kelas Read Only %s" ON public.%s 
      FOR SELECT USING (public.get_auth_role() = ''wali_kelas'')
    ', t, t);
    
  END LOOP;
END $$;
