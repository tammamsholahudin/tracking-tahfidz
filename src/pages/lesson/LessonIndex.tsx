import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, ChevronRight, BookOpen, Target, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import AddLessonModal from '@/components/AddLessonModal'
import { useAuthStore } from '@/store/authStore'
import { getSync, fetchBackground } from '@/lib/db'
import FabMenu from '@/components/FabMenu'
import styles from '../school/SchoolIndex.module.css'

interface GroupData {
  id: string
  name: string
  total_students: number
  progress: number
  teacher: string
  target_count: number
  meeting_count: number
  has_schedule: boolean
}

export default function LessonIndex() {
  const { activeWorkspaceId } = useAuthStore()
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [groups, setGroups] = useState<GroupData[]>([])

  const fetchGroups = () => {
    const localGroups = getSync('tahfidz_lesson_groups').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localStudents = getSync('tahfidz_lesson_students')
    const localTargets = getSync('tahfidz_targets').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localMeetings = getSync('tahfidz_meetings').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localSchedules = getSync('tahfidz_schedules').filter((x:any) => x.guru_id === activeWorkspaceId)

    const mappedLocal = localGroups.map((g: any) => {
      const studentCount = localStudents.filter((s: any) => s.group_id === g.id).length
      const targetCount = localTargets.filter((t: any) => t.entity_id === g.id && t.entity_type === 'les').length
      const meetingCount = localMeetings.filter((m: any) => m.entity_id === g.id && m.entity_type === 'les').length
      const hasSchedule = localSchedules.some((sch: any) => sch.entity_id === g.id && sch.entity_type === 'les')

      return {
        ...g,
        total_students: studentCount,
        target_count: targetCount,
        meeting_count: meetingCount,
        has_schedule: hasSchedule,
        teacher: g.teacher || '',
        progress: g.progress || 0
      }
    })
    setGroups(mappedLocal)

    if (navigator.onLine) {
      Promise.all([
        fetchBackground('lesson_groups', 'tahfidz_lesson_groups', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('students', 'tahfidz_lesson_students', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('targets', 'tahfidz_targets', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('meetings', 'tahfidz_meetings', { filterColumn: 'guru_id', filterValue: activeWorkspaceId })
      ]).catch(console.error)
    }
  }

  useEffect(() => {
    fetchGroups()
    const handleUpdate = () => fetchGroups()
    window.addEventListener('local_cache_updated', handleUpdate)
    return () => window.removeEventListener('local_cache_updated', handleUpdate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId])

  return (
    <>
      <div className="page-enter">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Grup Les</h1>
          <p className={styles.subtitle}>Kelola kelompok belajar Tahfidz & Tahsin</p>
        </div>
      </div>

      <div className="content-area">
        <div className={styles.grid}>
          {groups.map(g => (
            <Link to={`/les/${g.id}`} key={g.id} className={styles.classCard}>
              <div className={styles.classContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <div>
                    <h2 className={styles.className}>{g.name}</h2>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-gray-600)', marginBottom: 'var(--space-2)' }}>
                      👨‍🏫 Guru/Pembimbing:<br/>
                      <span style={{ fontWeight: '600', color: 'var(--clr-gray-900)' }}>{g.teacher || 'Belum ditentukan'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.classGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Jumlah Siswa</span>
                    <span className={styles.metaValue}><Users size={14} /> {g.total_students} Siswa</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Target Grup</span>
                    <span className={styles.metaValue}><Target size={14} /> {g.target_count} Surat</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Pertemuan</span>
                    <span className={styles.metaValue}><Calendar size={14} /> {g.meeting_count} Pertemuan</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Status Jadwal</span>
                    <span className={styles.metaValue} style={{ color: g.has_schedule ? 'var(--clr-success)' : 'var(--clr-warning)' }}>
                      {g.has_schedule ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} 
                      {g.has_schedule ? 'Sudah Diatur' : 'Belum Diatur'}
                    </span>
                  </div>
                </div>

                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressPct}>{g.progress}%</span>
                </div>
                <span className={styles.progressLabel}>
                  <TrendingUp size={12} /> Progress Hafalan
                </span>
              </div>
              <ChevronRight size={20} className={styles.arrow} />
            </Link>
          ))}
        </div>

        {groups.length === 0 && (
          <div className={styles.empty}>
            <BookOpen size={48} opacity={0.3} />
            <p>Tidak ada grup les ditemukan</p>
          </div>
        )}
      </div>

      {showAddGroup && (
        <AddLessonModal 
          onClose={() => setShowAddGroup(false)}
          onSuccess={() => {
            setShowAddGroup(false)
            fetchGroups()
          }}
        />
      )}
      </div>

      <FabMenu 
        actions={[{ id: 'tambah-les', label: 'Tambah Grup', icon: <BookOpen size={16} /> }]} 
        onAction={(action) => {
          if (action === 'tambah-les') setShowAddGroup(true)
        }} 
      />
    </>
  )
}
