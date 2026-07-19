// Mock data untuk demo lokal — akan diganti data Supabase saat online
export const MOCK_TEACHER = {
  id: 'demo-teacher-001',
  user_id: 'demo-user-001',
  name: 'Ust. Ahmad Fauzi, S.Pd',
  email: 'admin@tahfidzMAM.com',
  phone: '08123456789',
  photo_url: null,
  role: 'admin' as const,
  is_active: true,
}

export const MOCK_CLASSES = [
  { id: 'cls-1', name: 'Kelas 3 Bilal', total_students: 28, teacher: 'Ust. Ahmad Fauzi', semester: 'Ganjil', academic_year: '2025/2026', progress: 65, guru_id: 'demo-teacher-001' },
  { id: 'cls-2', name: 'Kelas 4 Ubay', total_students: 24, teacher: 'Ust. Ahmad Fauzi', semester: 'Ganjil', academic_year: '2025/2026', progress: 42, guru_id: 'demo-teacher-001' },
  { id: 'cls-3', name: 'Kelas 5 Zaid', total_students: 30, teacher: 'Ust. Ahmad Fauzi', semester: 'Ganjil', academic_year: '2025/2026', progress: 80, guru_id: 'demo-teacher-001' },
]

export const MOCK_LESSON_GROUPS = [
  { id: 'les-1', name: 'Les Senin Sore', day: 'Senin', time: '15:30', total_students: 8, guru_id: 'demo-teacher-001' },
  { id: 'les-2', name: 'Les Rabu Pagi', day: 'Rabu', time: '07:00', total_students: 6, guru_id: 'demo-teacher-001' },
  { id: 'les-3', name: 'Les Putri', day: 'Jumat', time: '14:00', total_students: 10, guru_id: 'demo-teacher-001' },
]

export const MOCK_PRIVATE_STUDENTS = [
  { id: 'prv-1', name: 'Muhammad Rizki', progress: 45, target: 'Juz 30', last_surah: "An-Naba'", last_verse: 18, guru_id: 'demo-teacher-001' },
  { id: 'prv-2', name: 'Fatimah Azzahra', progress: 72, target: 'Juz 29-30', last_surah: 'Al-Mulk', last_verse: 12, guru_id: 'demo-teacher-001' },
  { id: 'prv-3', name: 'Abdullah Hakim', progress: 30, target: 'Juz 30', last_surah: 'An-Nasr', last_verse: 3, guru_id: 'demo-teacher-001' },
]

export const MOCK_STUDENTS = [
  { id: 'std-01', nis: '2024001', name: 'Ahmad Rifqi',         gender: 'L', last_surah: "An-Naba'",   last_verse: 25, progress: 60, attendance: 'hadir' },
  { id: 'std-02', nis: '2024002', name: 'Bilal Khairudin',     gender: 'L', last_surah: "An-Naba'",   last_verse: 18, progress: 45, attendance: 'hadir' },
  { id: 'std-03', nis: '2024003', name: 'Cahaya Ramadhani',    gender: 'P', last_surah: "An-Nazi'at",  last_verse: 10, progress: 70, attendance: 'hadir' },
  { id: 'std-04', nis: '2024004', name: 'Daffa Maulana',       gender: 'L', last_surah: 'Abasa',       last_verse: 8,  progress: 35, attendance: 'izin'  },
  { id: 'std-05', nis: '2024005', name: 'Eka Putri Sari',      gender: 'P', last_surah: 'At-Takwir',   last_verse: 15, progress: 52, attendance: 'hadir' },
  { id: 'std-06', nis: '2024006', name: 'Farhan Nugroho',      gender: 'L', last_surah: 'Al-Infitar',  last_verse: 5,  progress: 28, attendance: 'sakit' },
  { id: 'std-07', nis: '2024007', name: 'Ghina Maulida',       gender: 'P', last_surah: 'Al-Mutaffifin',last_verse:20, progress: 65, attendance: 'hadir' },
  { id: 'std-08', nis: '2024008', name: 'Hafizh Ramadhan',     gender: 'L', last_surah: "An-Naba'",   last_verse: 40, progress: 100,attendance: 'hadir' },
]

export const MOCK_MEMORIZATION_HISTORY = [
  { id: 'mem-1', student: 'Ahmad Rifqi',      date: '2026-07-15', surah: "An-Naba'",   verses: '20-25', status: 'lancar',       score: 90, note: '' },
  { id: 'mem-2', student: 'Bilal Khairudin',  date: '2026-07-15', surah: "An-Naba'",   verses: '14-18', status: 'cukup_lancar', score: 75, note: 'Perlu ulang ayat 16' },
  { id: 'mem-3', student: 'Cahaya Ramadhani', date: '2026-07-15', surah: "An-Nazi'at",  verses: '6-10',  status: 'lancar',       score: 95, note: '' },
  { id: 'mem-4', student: 'Eka Putri Sari',   date: '2026-07-14', surah: 'At-Takwir',  verses: '12-15', status: 'perlu_murojaah',score: 60, note: 'Banyak terhenti' },
  { id: 'mem-5', student: 'Hafizh Ramadhan',  date: '2026-07-14', surah: "An-Naba'",   verses: '36-40', status: 'lancar',       score: 100,note: 'Sempurna!' },
]

export const MOCK_WEEKLY_STATS = [
  { day: 'Sen', ayat: 42, hadir: 26 },
  { day: 'Sel', ayat: 58, hadir: 24 },
  { day: 'Rab', ayat: 35, hadir: 28 },
  { day: 'Kam', ayat: 63, hadir: 27 },
  { day: "Jum'", ayat: 47, hadir: 25 },
  { day: 'Sab', ayat: 0,  hadir: 0  },
  { day: 'Ahd', ayat: 0,  hadir: 0  },
]

export const MEETING_STATUSES = [
  { value: 'pembelajaran', label: 'Pembelajaran Berlangsung', color: '#16a34a', bg: '#dcfce7', emoji: '🟢' },
  { value: 'guru_izin',    label: 'Guru Izin',               color: '#d97706', bg: '#fef3c7', emoji: '🟡' },
  { value: 'guru_sakit',   label: 'Guru Sakit',              color: '#dc2626', bg: '#fee2e2', emoji: '🔴' },
  { value: 'libur_nasional',label: 'Libur Nasional',          color: '#dc2626', bg: '#fee2e2', emoji: '🔴' },
  { value: 'libur_madrasah',label: 'Libur Madrasah',          color: '#dc2626', bg: '#fee2e2', emoji: '🔴' },
  { value: 'kegiatan',     label: 'Kegiatan Sekolah',        color: '#7c3aed', bg: '#ede9fe', emoji: '🟣' },
  { value: 'ujian',        label: 'Ujian',                   color: '#2563eb', bg: '#dbeafe', emoji: '🔵' },
  { value: 'asesmen',      label: 'Asesmen',                 color: '#2563eb', bg: '#dbeafe', emoji: '🔵' },
  { value: 'study_tour',   label: 'Study Tour',              color: '#7c3aed', bg: '#ede9fe', emoji: '🟣' },
  { value: 'class_meeting', label: 'Class Meeting',          color: '#7c3aed', bg: '#ede9fe', emoji: '🟣' },
  { value: 'hari_besar',   label: 'Hari Besar Islam',        color: '#92400e', bg: '#fef3c7', emoji: '🕌' },
  { value: 'cuaca_buruk',  label: 'Cuaca Buruk',             color: '#dc2626', bg: '#fee2e2', emoji: '⚠️' },
  { value: 'bencana',      label: 'Bencana',                 color: '#dc2626', bg: '#fee2e2', emoji: '⚠️' },
  { value: 'lainnya',      label: 'Lainnya',                 color: '#6b7f72', bg: '#f1f5f2', emoji: '📝' },
]
