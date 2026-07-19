import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { School, Users, TrendingUp, ChevronRight, BookOpen, Loader2, Target, Calendar, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AddClassModal from '@/components/AddClassModal'
import EditClassModal from '@/components/EditClassModal'
import { useAuthStore } from '@/store/authStore'
import FabMenu from '@/components/FabMenu'
import styles from './SchoolIndex.module.css'

interface ClassData {
  id: string
  name: string
  total_students: number
  semester: string
  academic_year: string
  progress: number
  homeroom_teacher: string
  target_count: number
  meeting_count: number
  has_schedule: boolean
}

export default function SchoolIndex() {
  const { activeWorkspaceId } = useAuthStore()
  const [search, setSearch] = useState('')
  const [showAddClass, setShowAddClass] = useState(false)
  const [editClass, setEditClass] = useState<ClassData | null>(null)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      if (supabaseUrl.includes('your-project.supabase.co')) {
        throw new Error('Using dummy Supabase credentials')
      }

      const { data, error } = await supabase
        .from('school_classes')
        .select('*')
        .eq('is_active', true)
        
      if (error) throw error
      
      const mapped = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        total_students: d.total_students || 0,
        academic_year: d.academic_year || '2026/2027', 
        semester: d.semester || 'Ganjil',
        progress: d.progress || 0,
        homeroom_teacher: d.homeroom_teacher || '',
        target_count: d.target_count || 0,
        meeting_count: d.meeting_count || 0,
        has_schedule: d.has_schedule || false
      }))
      setClasses(mapped)
    } catch (err) {
      console.error('Error fetching classes:', err)
      const localClasses = JSON.parse(localStorage.getItem('tahfidz_classes') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)
      const localStudents = JSON.parse(localStorage.getItem('tahfidz_students') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)
      
      const localTargets = JSON.parse(localStorage.getItem('tahfidz_targets') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)
      const localMeetings = JSON.parse(localStorage.getItem('tahfidz_meetings') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)
      const localSchedules = JSON.parse(localStorage.getItem('tahfidz_schedules') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)


      const mappedLocal = localClasses.map((c: any) => {
        const studentCount = localStudents.filter((s: any) => s.class_id === c.id && s.name).length
        const targetCount = localTargets.filter((t: any) => t.class_id === c.id).length
        const meetingCount = localMeetings.filter((m: any) => m.class_id === c.id).length
        const hasSchedule = localSchedules.some((sch: any) => sch.class_id === c.id)

        return {
          ...c,
          total_students: studentCount,
          target_count: targetCount,
          meeting_count: meetingCount,
          has_schedule: hasSchedule,
          homeroom_teacher: c.homeroom_teacher || '',
          progress: c.progress || 0
        }
      })
      setClasses(mappedLocal)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId])

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className={`${styles.page} page-enter`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerBg} />
          <div className={styles.headerContent} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className={styles.title}><School size={24} /> Modul Sekolah</h1>
              <p className={styles.subtitle}>Daftar kelas yang Anda ajarkan</p>
            </div>
          </div>
        </div>

      <div className="content-area">
        {/* Search */}
        <div className={styles.searchBar}>
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Cari kelas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className={styles.empty}>
            <Loader2 size={48} className="animate-spin" color="var(--clr-primary-600)" />
            <p>Memuat data kelas...</p>
          </div>
        ) : (
          <>
            {/* Class Cards */}
            <div className={styles.classList}>
              {filtered.map((cls, i) => (
                <Link
                  key={cls.id}
                  to={`/sekolah/${cls.id}`}
                  className={`${styles.classCard} animate-fade-in-up`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={styles.classIcon}>
                    <BookOpen size={22} />
                  </div>
                  <div className={styles.classInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <div>
                        <h2 className={styles.className}>{cls.name}</h2>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-gray-600)', marginBottom: 'var(--space-2)' }}>
                          👨‍🏫 Wali Kelas:<br/>
                          <span style={{ fontWeight: '600', color: 'var(--clr-gray-900)' }}>{cls.homeroom_teacher || 'Belum ditentukan'}</span>
                        </div>
                      </div>
                      <button 
                        className={styles.btnEdit}
                        onClick={(e) => {
                          e.preventDefault()
                          setEditClass(cls)
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    </div>

                    <div className={styles.classGrid}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Jumlah Siswa</span>
                        <span className={styles.metaValue}><Users size={14} /> {cls.total_students} Siswa</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Target Hafalan Kelas</span>
                        <span className={styles.metaValue}><Target size={14} /> {cls.target_count} Surat</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Pertemuan</span>
                        <span className={styles.metaValue}><Calendar size={14} /> {cls.meeting_count} Pertemuan</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Status Jadwal</span>
                        <span className={styles.metaValue} style={{ color: cls.has_schedule ? 'var(--clr-success)' : 'var(--clr-warning)' }}>
                          {cls.has_schedule ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} 
                          {cls.has_schedule ? 'Sudah Diatur' : 'Belum Diatur'}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className={styles.progressWrap}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${cls.progress}%` }}
                        />
                      </div>
                      <span className={styles.progressPct}>{cls.progress}%</span>
                    </div>
                    <span className={styles.progressLabel}>
                      <TrendingUp size={12} /> Progress Hafalan
                    </span>
                  </div>
                  <ChevronRight size={20} className={styles.arrow} />
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className={styles.empty}>
                <School size={48} opacity={0.3} />
                <p>Tidak ada kelas ditemukan</p>
              </div>
            )}
          </>
        )}
      </div>

      {showAddClass && (
        <AddClassModal 
          onClose={() => setShowAddClass(false)}
          onSuccess={() => {
            setShowAddClass(false)
            fetchClasses()
          }}
        />
      )}

      {editClass && (
        <EditClassModal 
          classData={editClass}
          onClose={() => setEditClass(null)}
          onSuccess={() => {
            setEditClass(null)
            fetchClasses()
          }}
        />
      )}
      </div>

      <FabMenu 
        actions={[{ id: 'tambah-kelas', label: 'Tambah Kelas', icon: <BookOpen size={16} /> }]} 
        onAction={(action) => {
          if (action === 'tambah-kelas') setShowAddClass(true)
        }} 
      />
    </>
  )
}

