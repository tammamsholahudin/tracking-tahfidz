import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Users, Target, TrendingUp, Calendar,
  ClipboardList, BookOpen, BarChart3, FileText, Settings,
  CheckCircle2, Loader2, Save, Building2, Trash2, Info, Link2, Copy, ExternalLink
} from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'
import { getSync, fetchBackground, mutateData } from '@/lib/db'
import AttendancePage from './Attendance'
import MemorizationPage from './Memorization'
import ClassProgressPage from './ClassProgress'
import PaymentPage from './PaymentPage'
import { exportAttendanceExcel, exportMemorizationExcel } from '@/lib/excel'
import { exportAttendancePDF, exportProgressPDF } from '@/lib/pdf'
import { moveToTrash } from '@/lib/trash'
import { SURAHS } from '@/data/surahs'
import { validateTargetSurah, calculateClassProgress, calculateStudentProgress, calculateOverallProgress, getStatusLabel } from '@/lib/progressEngine'
import FabMenu from '@/components/FabMenu'
import ExportModal from '@/components/ExportModal'
import ImportStudentModal from '@/components/ImportStudentModal'
import AddStudentModal from '@/components/AddStudentModal'
import EditStudentModal from '@/components/EditStudentModal'
import SetJadwalModal from '@/components/SetJadwalModal'
import AddMeetingModal from '@/components/AddMeetingModal'
import MeetingWorkspace from './MeetingWorkspace'
import ScheduleIndex from './ScheduleIndex'
import toast from 'react-hot-toast'
import styles from './ClassDashboard.module.css'

export default function ClassDashboard() {
  const { classId } = useParams()
  const { pathname } = useLocation()
  const entityType = pathname.startsWith('/sekolah') ? 'sekolah' : pathname.startsWith('/les') ? 'les' : 'privat'

  const navigate = useNavigate()
  const { institutionName, institutionSubtitle } = useSettingsStore()
  const { activeWorkspaceId } = useAuthStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showExport, setShowExport] = useState<'absensi' | 'hafalan' | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showEditStudent, setShowEditStudent] = useState<any>(null)
  const [showSetJadwal, setShowSetJadwal] = useState(false)
  const [showAddMeeting, setShowAddMeeting] = useState(false)
  
  const [cls, setCls] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const [stats, setStats] = useState({ meetings: 0, attendancePct: 0, todaySetoran: 0 })
  const [loading, setLoading] = useState(true)
  const [memorizationRecords, setMemorizationRecords] = useState<any[]>([])

  const getTabs = () => {
    let tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
      { id: 'siswa',     label: entityType === 'privat' ? 'Profil Siswa' : 'Siswa', icon: <Users size={16} /> },
      { id: 'target',    label: 'Target Hafalan', icon: <Target size={16} /> },
      { id: 'jadwal',    label: 'Jadwal',    icon: <Calendar size={16} /> },
      { id: 'pertemuan', label: 'Pertemuan', icon: <CheckCircle2 size={16} /> },
      { id: 'absensi',   label: 'Absensi',   icon: <ClipboardList size={16} /> },
      { id: 'setoran',   label: 'Setoran Hafalan', icon: <BookOpen size={16} /> },
      { id: 'progress',  label: 'Progress',  icon: <TrendingUp size={16} /> },
      { id: 'laporan',   label: 'Laporan',   icon: <FileText size={16} /> }
    ]

    if (entityType === 'les' || entityType === 'privat') {
      tabs.push({ id: 'pembayaran', label: 'Pembayaran', icon: <Settings size={16} /> })
    }

    tabs.push({ id: 'settings', label: 'Pengaturan', icon: <Settings size={16} /> })
    return tabs
  }

  const TABS = getTabs()

  useEffect(() => {
    fetchClassData()
    window.addEventListener('local_cache_updated', fetchClassData)
    return () => window.removeEventListener('local_cache_updated', fetchClassData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, activeWorkspaceId])

  const fetchClassData = async () => {
    setLoading(true)
    try {
      let localClass = null

      if (entityType === 'sekolah') {
        const localClasses = getSync('tahfidz_classes').filter((x:any) => x.guru_id === activeWorkspaceId)
        localClass = localClasses.find((c: any) => c.id === classId)
      } else if (entityType === 'les') {
        const localGroups = getSync('tahfidz_lesson_groups').filter((x:any) => x.guru_id === activeWorkspaceId)
        localClass = localGroups.find((g: any) => g.id === classId)
      } else if (entityType === 'privat') {
        const localPrivates = getSync('tahfidz_private_students').filter((x:any) => x.guru_id === activeWorkspaceId)
        localClass = localPrivates.find((p: any) => p.id === classId)
      }
      
      if (localClass) {
        setCls(localClass)
        
        let mappedStudents = []
        if (entityType === 'sekolah') {
          const allLocalStudents = getSync('tahfidz_students')
          mappedStudents = allLocalStudents.filter((s: any) => s.class_id === classId)
        } else if (entityType === 'les') {
          const allLessonStudents = getSync('tahfidz_lesson_students')
          mappedStudents = allLessonStudents.filter((s: any) => s.group_id === classId)
        } else if (entityType === 'privat') {
          mappedStudents = [localClass] 
        }
        
        mappedStudents.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
        setStudents(mappedStudents)

        const localTargets = getSync('tahfidz_targets')
        setTargets(localTargets.filter((t: any) => t.class_id === classId))
        
        const allMeetings = getSync('tahfidz_meetings')
        const classMeetings = allMeetings.filter((m: any) => m.class_id === classId)
        
        const allAtt = getSync('tahfidz_attendance_records')
        let totalAtt = 0
        let totalHadir = 0
        classMeetings.forEach((m: any) => {
          const mAtt = allAtt.filter((a: any) => a.meeting_id === m.id)
          totalAtt += mAtt.length
          totalHadir += mAtt.filter((a: any) => a.status === 'hadir').length
        })
        const attendancePct = totalAtt > 0 ? Math.round((totalHadir / totalAtt) * 100) : 0

        const allMem = getSync('tahfidz_memorization_records')
        const todayStr = new Date().toISOString().split('T')[0]
        const classMem = allMem.filter((m: any) => m.class_id === classId)
        const todaySetoran = classMem.filter((m: any) => m.date?.startsWith(todayStr) || m.created_at?.startsWith(todayStr)).length

        setStats({ meetings: classMeetings.length, attendancePct, todaySetoran })
        setMemorizationRecords(classMem)
      }

      // 2. Fetch background (SWR)
      if (navigator.onLine) {
        Promise.all([
          fetchBackground('school_classes', 'tahfidz_classes', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
          fetchBackground('students', 'tahfidz_students', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
          fetchBackground('targets', 'tahfidz_targets', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
          fetchBackground('meetings', 'tahfidz_meetings', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
          fetchBackground('attendance', 'tahfidz_attendance_records', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
          fetchBackground('memorization_records', 'tahfidz_memorization_records', { filterColumn: 'guru_id', filterValue: activeWorkspaceId })
        ]).catch(console.error)
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers for Target ---
  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    const semester = formData.get('semester') as string
    const surahName = formData.get('surah') as string

    if (!surahName) {
      toast.error('Silakan pilih surat.')
      return
    }

    const { valid, error } = validateTargetSurah(surahName)
    if (!valid) {
      toast.error(error || 'Surat tidak valid')
      return
    }

    // Check for duplicates
    const isDuplicate = targets.some(t => t.surah === surahName && t.semester === semester)
    if (isDuplicate) {
      toast.error(`Surat ${surahName} sudah ada di target Semester ${semester}.`)
      return
    }
    
    const newTarget = {
      id: `tgt-${Date.now()}`,
      class_id: cls.id,
      guru_id: activeWorkspaceId,
      semester: semester,
      surah: surahName
    }
    
    mutateData('targets', 'INSERT', newTarget, 'tahfidz_targets')
    
    setTargets([...targets, newTarget])
    toast.success('Target berhasil disimpan')
    form.reset()
  }

  const handleDeleteTarget = async (id: string) => {
    if (!confirm('Hapus target ini? Data akan dipindahkan ke Sampah.')) return
    const target = targets.find(t => t.id === id)
    if (target) {
      await mutateData('targets', 'DELETE', { id }, 'tahfidz_targets')
      setTargets(targets.filter(t => t.id !== id))
      toast.success('Target berhasil dihapus')
    }
  }

  // --- Calculate Dynamic Progress ---
  const dynamicClassProgress = calculateClassProgress(students, targets, memorizationRecords)
  
  let siswaCapai = 0
  let siswaHampir = 0
  let siswaBelum = 0
  
  students.forEach(s => {
    const prog = calculateStudentProgress(s.id, targets, memorizationRecords)
    if (prog.status === 'tercapai') siswaCapai++
    else if (prog.status === 'hampir_tercapai') siswaHampir++
    else siswaBelum++
  })

  // ── Class Settings State ──
  const [clsForm, setClsForm] = useState({
    name: '',
    homeroom_teacher: '',
    grade_level: '3',
    semester: 'Ganjil',
    academic_year: '2026/2027',
    notes: '',
  })
  const [savingCls, setSavingCls] = useState(false)

  // Sync form when cls loads
  useEffect(() => {
    if (cls) {
      setClsForm({
        name: cls.name ?? '',
        homeroom_teacher: cls.homeroom_teacher ?? '',
        grade_level: cls.grade_level ?? '3',
        semester: cls.semester ?? 'Ganjil',
        academic_year: cls.academic_year ?? '2026/2027',
        notes: cls.notes ?? '',
      })
    }
  }, [cls])

  const handleSaveClassSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clsForm.name.trim()) { toast.error('Nama kelas tidak boleh kosong.'); return }
    setSavingCls(true)
    await new Promise(r => setTimeout(r, 500))

    // Update Supabase
    await mutateData('school_classes', 'UPDATE', { id: classId, ...clsForm, name: clsForm.name.trim() }, 'tahfidz_classes')

    // Update in-memory cls
    setCls((prev: any) => ({ ...prev, ...clsForm, name: clsForm.name.trim() }))
    setSavingCls(false)
    toast.success('Pengaturan kelas berhasil disimpan!')
  }

  const handleDeactivateClass = () => {
    if (!window.confirm(`Yakin ingin menonaktifkan kelas "${cls.name}"? Kelas tidak akan tampil di daftar aktif.`)) return
    mutateData('school_classes', 'UPDATE', { id: classId, is_active: false }, 'tahfidz_classes').then(() => {
      toast.success(`Kelas "${cls.name}" dinonaktifkan.`)
      navigate('/sekolah')
    })
  }

  const weeklyData = [20, 35, 28, 42, 38, 0, 0]
  const days = ['Sen','Sel','Rab','Kam',"Jum'",'Sab','Ahd']
  const maxW = Math.max(...weeklyData, 1)

  if (loading) {
    return (
      <div className={`${styles.page} page-enter`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--clr-primary-600)" />
      </div>
    )
  }

  if (!cls) {
    return <div className={styles.page}>Kelas tidak ditemukan.</div>
  }

  return (
    <>
      <div className={`${styles.page} page-enter`}>
        {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link to={`/${entityType}`} className={styles.backBtn}>
            <ArrowLeft size={18} /> {entityType === 'sekolah' ? 'Kelas' : entityType === 'les' ? 'Grup Les' : 'Santri Privat'}
          </Link>
          <span className={styles.headerBadge}>🟢 Aktif</span>
        </div>
        <h1 className={styles.className}>{cls.name}</h1>
        <div className={styles.headerMeta} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span>👨‍🏫 {entityType === 'sekolah' ? 'Wali Kelas' : 'Guru'}: <strong style={{ color: 'white' }}>{cls.homeroom_teacher || cls.teacher || 'Belum ditentukan'}</strong></span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <span><Users size={13} /> {students.length} Siswa</span>
            <span><Calendar size={13} /> Tahun Ajaran {cls.academic_year}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabWrap}>
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="content-area">
        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div className={styles.dashContent}>
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <div className={styles.statVal}>{students.length}</div>
                <div className={styles.statLabel}><Users size={13} /> Total Siswa</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statVal} style={{ color: 'var(--clr-primary-600)' }}>{stats.meetings}</div>
                <div className={styles.statLabel}><Calendar size={13} /> Jml Pertemuan</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statVal} style={{ color: 'var(--clr-info)' }}>{stats.attendancePct}%</div>
                <div className={styles.statLabel}><ClipboardList size={13} /> Kehadiran</div>
              </div>
            </div>
            
            <div className={styles.statsRow} style={{ marginTop: 'var(--space-4)' }}>
              <div className={styles.statBox}>
                <div className={styles.statVal} style={{ color: 'var(--clr-warning)' }}>{stats.todaySetoran}</div>
                <div className={styles.statLabel}><BookOpen size={13} /> Setoran Hari Ini</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statVal} style={{ color: 'var(--clr-success)' }}>{siswaCapai}</div>
                <div className={styles.statLabel}><CheckCircle2 size={13} /> Capai Target</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statVal} style={{ color: 'var(--clr-danger)' }}>{siswaBelum}</div>
                <div className={styles.statLabel}><TrendingUp size={13} /> Belum Capai</div>
              </div>
            </div>

            {/* Progress Kelas */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><TrendingUp size={16} /> Progress Target Semester</h3>
              <div className={styles.bigProgressWrap}>
                <div className={styles.bigProgress}>
                  <div className={styles.bigProgressFill} style={{ width: `${dynamicClassProgress}%` }} />
                </div>
                <span className={styles.bigProgressPct}>{dynamicClassProgress}%</span>
              </div>

              {/* Student status breakdown */}
              <div className={styles.breakdown}>
                <div className={styles.breakItem}>
                  <div className={styles.breakDot} style={{ background: 'var(--clr-success)' }} />
                  <span>Mencapai target</span>
                  <strong style={{ color: 'var(--clr-success)' }}>{siswaCapai} siswa</strong>
                </div>
                <div className={styles.breakItem}>
                  <div className={styles.breakDot} style={{ background: 'var(--clr-warning)' }} />
                  <span>Hampir mencapai</span>
                  <strong style={{ color: 'var(--clr-warning)' }}>{siswaHampir} siswa</strong>
                </div>
                <div className={styles.breakItem}>
                  <div className={styles.breakDot} style={{ background: 'var(--clr-danger)' }} />
                  <span>Belum mencapai</span>
                  <strong style={{ color: 'var(--clr-danger)' }}>{siswaBelum} siswa</strong>
                </div>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><BarChart3 size={16} /> Setoran Mingguan</h3>
              <div className={styles.miniChart}>
                {weeklyData.map((val, i) => (
                  <div key={i} className={styles.miniBar}>
                    <div className={styles.miniBarInner}>
                      <div
                        className={styles.miniBarFill}
                        style={{ height: `${(val / maxW) * 100}%` }}
                      />
                    </div>
                    <span>{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Student List preview */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><Users size={16} /> Daftar Siswa</h3>
              <div className={styles.studentList}>
                {students.map((s: any) => {
                  const studentProg = calculateStudentProgress(s.id, targets, memorizationRecords)
                  const overall = calculateOverallProgress(s.id, memorizationRecords)
                  return (
                  <div key={s.id} className={styles.studentRow} style={{ flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <div className={styles.studentAvatar}>
                        {(s.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.studentInfo}>
                        <span className={styles.studentName}>{s.name || 'Siswa Tanpa Nama'}</span>
                        <span className={styles.studentSurah}>
                          {studentProg.suratSelesai} dari {studentProg.suratTarget} surat selesai
                        </span>
                      </div>
                      <div className={styles.studentRight}>
                        <div className={styles.miniProgress}>
                          <div style={{ width: `${studentProg.pct}%` }} />
                        </div>
                        <span
                          className={`badge badge-${s.attendance}`}
                        >
                          {s.attendance === 'hadir' ? '✓ Hadir'
                           : s.attendance === 'izin' ? 'Izin'
                           : s.attendance === 'sakit' ? 'Sakit'
                           : 'Alpa'}
                        </span>
                      </div>
                    </div>
                    {/* Hafalan Keseluruhan Block */}
                    <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'var(--clr-gray-50)', borderRadius: '4px', display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--clr-gray-600)' }}>
                      <div><strong>Hafalan Keseluruhan:</strong></div>
                      <div>Total: <strong>{overall.totalSurat} Surat</strong></div>
                      <div>Juz Tertinggi: <strong>Juz {overall.juzTertinggi}</strong></div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        )}

        {/* ── JADWAL TAB ── */}
        {activeTab === 'jadwal' && <ScheduleIndex entityId={cls.id} entityType={entityType} entityName={cls.name} />}

        {/* ── PERTEMUAN TAB ── */}
        {activeTab === 'pertemuan' && <MeetingWorkspace entityId={cls.id} entityType={entityType} entityName={cls.name} />}

        {/* ── ABSENSI TAB ── */}
        {activeTab === 'absensi' && <AttendancePage entityId={cls.id} entityType={entityType} entityData={cls} />}
        
        {/* ── SETORAN TAB ── */}
        {activeTab === 'setoran' && <MemorizationPage entityId={cls.id} entityType={entityType} entityData={cls} />}
        
        {/* ── PROGRESS TAB ── */}
        {activeTab === 'progress' && <ClassProgressPage entityId={cls.id} entityType={entityType} entityData={cls} />}

        {/* ── PEMBAYARAN TAB (Les/Privat only) ── */}
        {activeTab === 'pembayaran' && (entityType === 'les' || entityType === 'privat') && (
          <PaymentPage entityId={cls.id} entityType={entityType} entityData={cls} />
        )}

        {/* ── SISWA TAB ── */}
        {activeTab === 'siswa' && (
          <div className={styles.dashContent}>
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}><Users size={16} /> Manajemen Siswa</h3>
                <button 
                  className={styles.btnPrimary} 
                  style={{ padding: '8px 16px', fontSize: 'var(--text-sm)' }}
                  onClick={() => setShowAddStudent(true)}
                >
                  + Tambah Siswa
                </button>
              </div>
              <p style={{ color: 'var(--clr-gray-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                Daftar siswa dan pengaturan khusus untuk {cls.name}
              </p>

              {students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--clr-gray-400)', border: '1px dashed var(--clr-gray-200)', borderRadius: 'var(--radius-md)' }}>
                  Belum ada siswa di kelas ini.<br/><br/>
                  <button className={styles.btnOutline} onClick={() => setShowImport(true)}>Import dari Excel</button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--clr-gray-200)', textAlign: 'left' }}>
                        <th style={{ padding: '12px', color: 'var(--clr-gray-500)', width: 40 }}>No</th>
                        <th style={{ padding: '12px', color: 'var(--clr-gray-500)' }}>NIS</th>
                        <th style={{ padding: '12px', color: 'var(--clr-gray-500)' }}>Nama Lengkap</th>
                        <th style={{ padding: '12px', color: 'var(--clr-gray-500)' }}>Status</th>
                        <th style={{ padding: '12px', color: 'var(--clr-gray-500)' }}>Catatan Khusus</th>
                        <th style={{ padding: '12px', color: 'var(--clr-gray-500)', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s: any, idx: number) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--clr-gray-100)' }}>
                          <td style={{ padding: '12px', color: 'var(--clr-gray-500)', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '12px' }}>{s.nis || '-'}</td>
                          <td style={{ padding: '12px', fontWeight: '500' }}>{s.name || 'Siswa Tanpa Nama'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--clr-success)', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                              AKTIF
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <input
                              type="text"
                              value={s.note || ''}
                              placeholder="Tambah catatan..."
                              onChange={(e) => {
                                const newNote = e.target.value;
                                const updated = students.map(st => st.id === s.id ? { ...st, note: newNote } : st);
                                setStudents(updated);
                              }}
                              onBlur={(e) => {
                                // Save on blur
                                mutateData('students', 'UPDATE', { id: s.id, note: e.target.value }, 'tahfidz_students').then(() => {
                                  toast.success('Catatan disimpan');
                                })
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 12px',
                                border: '1px solid var(--clr-gray-200)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '12px',
                                background: 'transparent'
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className={styles.btnOutline} style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => setShowEditStudent(s)}>
                                Edit
                              </button>
                              <button className={styles.btnOutline} style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => {
                                 if (confirm('Hapus siswa ini? Data akan dipindahkan ke Sampah.')) {
                                   moveToTrash('students', s.id, s.name, 'Guru', activeWorkspaceId || '')
                                   setStudents(students.filter(st => st.id !== s.id))
                                   toast.success('Siswa dipindahkan ke Sampah')
                                 }
                              }}>
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TARGET TAB ── */}
        {activeTab === 'target' && (
          <div className={styles.dashContent}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><Target size={16} /> Kelola Target Hafalan</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-gray-500)', marginBottom: 'var(--space-4)' }}>
                Target ini akan menjadi acuan perhitungan otomatis progress siswa. Tidak boleh ada duplikasi target (surat dan ayat yang sama persis).
              </p>

              <form onSubmit={handleAddTarget} style={{ background: 'var(--clr-gray-50)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Semester</label>
                  <select name="semester" className="form-input" required>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Pilih Surat</label>
                  <select name="surah" className="form-input" required>
                    <option value="">-- Pilih Surat --</option>
                    {SURAHS.map(s => (
                      <option key={s.number} value={s.name_latin}>{s.number}. {s.name_latin}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: 'var(--space-2)' }}>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Simpan Target</button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {targets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--clr-gray-400)', border: '1px dashed var(--clr-gray-200)', borderRadius: 'var(--radius-md)' }}>
                    Belum ada target yang diatur.
                  </div>
                ) : (
                  ['Ganjil', 'Genap'].map(sem => {
                    const semTargets = targets.filter(t => t.semester === sem);
                    if (semTargets.length === 0) return null;
                    return (
                      <div key={sem} style={{ marginBottom: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--clr-gray-200)', paddingBottom: '8px', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: 0 }}>Semester {sem}</h4>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--clr-primary-700)' }}>
                            Jumlah Target: {semTargets.length} Surat
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {semTargets.map((t, idx) => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--clr-gray-200)', borderRadius: 'var(--radius-md)', background: 'white' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                <div style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary-700)', width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 'var(--text-xs)' }}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 'bold', color: 'var(--clr-gray-800)' }}>{t.surah}</div>
                                </div>
                              </div>
                              <button onClick={() => handleDeleteTarget(t.id)} className="btn-outline" style={{ borderColor: 'var(--clr-danger)', color: 'var(--clr-danger)', padding: '6px 12px', fontSize: 'var(--text-xs)' }}>Hapus</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}



        {/* ── LAPORAN TAB ── */}
        {activeTab === 'laporan' && (
          <div className={styles.dashContent}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><FileText size={16} /> Laporan & Rekapitulasi</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-gray-500)', marginBottom: 'var(--space-4)' }}>
                Download laporan kelas dalam format Excel atau PDF.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button 
                  className={styles.btnOutline} 
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-gray-200)', cursor: 'pointer', background: 'white' }}
                  onClick={() => setShowExport('absensi')}
                >
                  <ClipboardList size={20} color="var(--clr-primary-600)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold' }}>Laporan Absensi</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-500)' }}>Rekap kehadiran siswa per pertemuan</div>
                  </div>
                </button>

                <button 
                  className={styles.btnOutline} 
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-gray-200)', cursor: 'pointer', background: 'white' }}
                  onClick={() => setShowExport('hafalan')}
                >
                  <BookOpen size={20} color="var(--clr-primary-600)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold' }}>Laporan Progress Hafalan</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-500)' }}>Pencapaian target setoran hafalan</div>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Portal Wali Murid ── */}
            <div className={styles.card} style={{ border: '1.5px solid #b9efc5', background: 'linear-gradient(135deg, #f0faf3, #fff)' }}>
              <h3 className={styles.cardTitle} style={{ color: '#316342' }}>
                <Link2 size={16} /> 🔗 Portal Wali Murid
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-gray-500)', marginBottom: 'var(--space-4)' }}>
                Bagikan tautan ini kepada wali murid melalui WhatsApp. Wali murid cukup membuka tautan dan memasukkan nama lengkap anak untuk melihat laporan hafalan secara online.
              </p>
              <div style={{ background: '#f4fafd', border: '1px solid #c1c9bf', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: '#316342', wordBreak: 'break-all', marginBottom: 'var(--space-4)', userSelect: 'all' }}>
                {window.location.origin}/portal/{classId}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  style={{ gap: 'var(--space-2)', display: 'flex', alignItems: 'center' }}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/portal/${classId}`)
                    toast.success('Link portal berhasil disalin!')
                  }}
                >
                  <Copy size={15} /> Salin Link
                </button>
                <button
                  className={styles.btnOutline}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                  onClick={() => window.open(`/portal/${classId}`, '_blank')}
                >
                  <ExternalLink size={15} /> Buka Portal
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ── PENGATURAN KELAS TAB ── */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 640, margin: '0 auto' }}>

            {/* ── IDENTITAS KELAS ── */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--clr-gray-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)', padding: '0 var(--space-1)' }}>Identitas Kelas</div>
              <div className={styles.card}>
                <form onSubmit={handleSaveClassSettings} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Nama Kelas</label>
                    <input
                      id="input-nama-kelas"
                      type="text"
                      className="form-input"
                      value={clsForm.name}
                      onChange={e => setClsForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Contoh: Kelas 3 Bilal"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Nama Wali Kelas</label>
                    <input
                      id="input-wali-kelas"
                      type="text"
                      className="form-input"
                      value={clsForm.homeroom_teacher}
                      onChange={e => setClsForm(f => ({ ...f, homeroom_teacher: e.target.value }))}
                      placeholder="Contoh: Ust. Ahmad Fauzi, S.Pd"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Tingkat</label>
                      <select
                        id="select-tingkat"
                        className="form-input"
                        value={clsForm.grade_level}
                        onChange={e => setClsForm(f => ({ ...f, grade_level: e.target.value }))}
                      >
                        {[1,2,3,4,5,6].map(lvl => (
                          <option key={lvl} value={String(lvl)}>Kelas {lvl}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tahun Ajaran</label>
                    <select
                      id="select-tahun-ajaran"
                      className="form-input"
                      value={clsForm.academic_year}
                      onChange={e => setClsForm(f => ({ ...f, academic_year: e.target.value }))}
                    >
                      {['2024/2025','2025/2026','2026/2027','2027/2028','2028/2029'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Keterangan <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-400)' }}>opsional</span></label>
                    <textarea
                      id="input-keterangan-kelas"
                      className="form-input"
                      value={clsForm.notes}
                      onChange={e => setClsForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Keterangan tambahan kelas..."
                      rows={2}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button
                    id="btn-simpan-pengaturan-kelas"
                    type="submit"
                    className="btn-primary"
                    disabled={savingCls}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Save size={15} /> {savingCls ? 'Menyimpan...' : 'Simpan Pengaturan Kelas'}
                  </button>
                </form>
              </div>
            </div>

            {/* ── INFO INSTANSI (Pengaturan Umum) ── */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--clr-gray-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)', padding: '0 var(--space-1)' }}>Instansi (Pengaturan Umum)</div>
              <div className={styles.card}>
                <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--clr-gray-800)', marginBottom: 4 }}>{institutionName}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-500)', marginBottom: 'var(--space-3)' }}>{institutionSubtitle}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--clr-primary-50)', color: 'var(--clr-primary-700)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)' }}>
                      <Info size={12} />
                      Nama instansi ini muncul di semua laporan PDF dan Excel. Untuk mengubahnya, buka <Link to="/pengaturan" style={{ color: 'var(--clr-primary-600)', fontWeight: 'var(--font-semibold)', textDecoration: 'none' }}>Pengaturan → Instansi</Link>.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── ZONA BERBAHAYA ── */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)', padding: '0 var(--space-1)' }}>Zona Berbahaya</div>
              <div className={styles.card} style={{ border: '1px solid #fecaca' }}>
                <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Trash2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--clr-gray-800)' }}>Nonaktifkan Kelas</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-500)' }}>Kelas tidak akan tampil di daftar aktif. Data siswa tetap aman.</div>
                    </div>
                  </div>
                  <button
                    id="btn-nonaktifkan-kelas"
                    style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '8px 16px', cursor: 'pointer', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}
                    onClick={handleDeactivateClass}
                  >
                    Nonaktifkan
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {showExport && (
        <ExportModal 
          type={showExport}
          onClose={() => setShowExport(null)}
          onExport={(format: string, filter: any) => {
            setShowExport(null)
            toast.success(`Memproses export ${showExport} dalam format ${format.toUpperCase()}...`)
            
            setTimeout(() => {
              if (showExport === 'hafalan') {
                const allMem = JSON.parse(localStorage.getItem('tahfidz_memorization_records') || '[]')
                const data = students.map((s, index) => {
                  const activeTargets = targets.filter(t => t.semester === filter.semester)
                  const prog = calculateStudentProgress(s.id, activeTargets, allMem)
                  const overall = calculateOverallProgress(s.id, allMem)
                  return {
                    No: index + 1,
                    Nama: s.name,
                    'Target Hafalan Kelas': activeTargets.map(t => t.surah).join(', ') || '-',
                    'Total Target Surat': prog.suratTarget,
                    'Surat Selesai': prog.suratSelesai,
                    'Persentase Progress': `${prog.pct}%`,
                    'Status Progress': getStatusLabel(prog.status),
                    'Juz Tertinggi': overall.juzTertinggi,
                    'Total Hafalan Keseluruhan': `${overall.totalSurat} Surat`,
                    'Surat Terakhir': overall.suratTerakhir,
                    'Jumlah Setoran': overall.jumlahSetoran,
                    'Nilai Rata-rata': overall.nilaiRataRata,
                    '_history': overall.riwayat
                  }
                })
                
                if (format === 'excel') exportMemorizationExcel(data, cls, `Laporan_Hafalan.xlsx`)
                if (format === 'pdf') exportProgressPDF(data, cls, `Laporan_Hafalan.pdf`)
              } else {
                const allMeetings = JSON.parse(localStorage.getItem('tahfidz_meetings') || '[]').filter((m: any) => m.class_id === classId)
                const allAtt = JSON.parse(localStorage.getItem('tahfidz_attendance_records') || '[]').filter((a: any) => a.class_id === classId)
                
                const data = students.map((s, index) => {
                  const row: any = { No: index + 1, Nama: s.name }
                  let h = 0, i = 0, sk = 0, a = 0
                  
                  allMeetings.forEach((m: any, mIdx: number) => {
                    const rec = allAtt.find((att: any) => att.meeting_id === m.id && att.student_id === s.id)
                    const status = rec ? rec.status : '-'
                    const dateStr = new Date(m.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
                    row[`P${mIdx + 1}\n(${dateStr})`] = status
                    if (status === 'hadir') h++
                    if (status === 'izin') i++
                    if (status === 'sakit') sk++
                    if (status === 'alpa') a++
                  })
                  
                  row['Hadir'] = h
                  row['Izin'] = i
                  row['Sakit'] = sk
                  row['Alpha'] = a
                  row['Persentase'] = allMeetings.length > 0 ? Math.round((h / allMeetings.length) * 100) + '%' : '0%'
                  return row
                })

                if (format === 'excel') exportAttendanceExcel(data, cls, `Laporan_Absensi.xlsx`)
                if (format === 'pdf') exportAttendancePDF(data, cls, `Laporan_Absensi.pdf`)
              }
              toast.success('Download selesai!')
            }, 1000)
          }}
        />
      )}
      </div>

      <FabMenu 
        actions={[
          { id: 'tambah-siswa', label: 'Tambah Siswa', icon: <Users size={16} /> },
          { id: 'import-siswa', label: 'Import Data Siswa', icon: <FileText size={16} /> },
          { id: 'atur-jadwal', label: 'Atur Jadwal', icon: <Calendar size={16} /> },
          { id: 'target-hafalan', label: 'Target Hafalan', icon: <Target size={16} /> },
          { id: 'tambah-pertemuan', label: 'Tambah Pertemuan', icon: <CheckCircle2 size={16} /> }
        ]}
        onAction={(action) => {
          if (action === 'tambah-siswa') {
            setShowAddStudent(true)
          } else if (action === 'import-siswa') {
            setShowImport(true)
          } else if (action === 'atur-jadwal') {
            setShowSetJadwal(true)
          } else if (action === 'target-hafalan') {
            setActiveTab('target')
            toast.success('Halaman Target Hafalan')
          } else if (action === 'tambah-pertemuan') {
            setShowAddMeeting(true)
          }
        }} 
      />

      {showImport && (
        <ImportStudentModal 
          onClose={() => setShowImport(false)}
          onImportComplete={(importData, _action) => {
            setShowImport(false)
            
            const newStudents = importData.map((d: any, i: number) => ({
              id: `stu-${Date.now()}-${i}`,
              class_id: cls.id,
              guru_id: activeWorkspaceId,
              name: d.nama || d.name,
              nis: d.nis || '',
              progress: 0,
              last_surah: 'An-Naba',
              last_verse: 1,
              attendance: 'hadir',
              created_at: new Date().toISOString()
            }))
            
            mutateData('students', 'INSERT', newStudents, 'tahfidz_students').then(() => {
              toast.success(`Berhasil mengimport ${importData.length} siswa ke kelas ${cls.name}!`)
              fetchClassData()
            })
          }}
        />
      )}

      {showAddStudent && (
        <AddStudentModal 
          entityId={cls.id}
          entityType={entityType}
          onClose={() => setShowAddStudent(false)}
          onSuccess={() => {
            setShowAddStudent(false)
            fetchClassData()
          }}
        />
      )}

      {showEditStudent && (
        <EditStudentModal
          studentData={showEditStudent}
          entityType={entityType}
          onClose={() => setShowEditStudent(null)}
          onSuccess={() => {
            setShowEditStudent(null)
            fetchClassData()
          }}
        />
      )}

      {showSetJadwal && (
        <SetJadwalModal 
          entityType="sekolah"
          entityId={cls.id}
          entityName={cls.name}
          onClose={() => setShowSetJadwal(false)}
          onSuccess={() => setShowSetJadwal(false)}
        />
      )}

      {showAddMeeting && (
        <AddMeetingModal
          entityId={cls.id}
          entityType={entityType}
          entityName={cls.name}
          onClose={() => setShowAddMeeting(false)}
          onSuccess={() => {
            setShowAddMeeting(false)
            setActiveTab('pertemuan') // Auto-switch to pertemuan tab
          }}
        />
      )}
    </>
  )
}

