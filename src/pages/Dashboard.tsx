import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  School, Home, TrendingUp, Users, Calendar as CalendarIcon, 
  Clock, MapPin, Bell, Settings, FileText, CheckCircle2, AlertTriangle, Plus, Loader2, X
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatTanggal } from '@/data/surahs'
import toast from 'react-hot-toast'
import { getSync, fetchBackground, mutateData } from '@/lib/db'
import SetJadwalModal from '@/components/SetJadwalModal'
import { exportToICS } from '@/lib/scheduleEngine'
import styles from './Dashboard.module.css'
import scheduleStyles from './DashboardSchedule.module.css'

interface Schedule {
  id: string
  entity_type: 'sekolah' | 'les' | 'privat' | 'manual'
  entity_id: string
  title: string
  day: string
  start_time: string
  end_time: string
  location: string
  color: string
  class_id?: string
}

interface Todo {
  id: string
  text: string
  done: boolean
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function Dashboard() {
  const { profile, activeWorkspaceId } = useAuthStore()
  const navigate = useNavigate()
  
  // Realtime clock
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const [greeting, setGreeting] = useState('')
  const [counts, setCounts] = useState({ classes: 0, lessons: 0, privates: 0, students: 0, setoran: 0 })
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [weeklyStats, setWeeklyStats] = useState({ target: 0, setoran: 0, pct: 0 })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  
  // UI States
  const [scheduleTab, setScheduleTab] = useState<'day' | 'week' | 'month'>('week')
  const [scheduleFilter, setScheduleFilter] = useState<string>('Semua')
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Setoran Kelas 3 Bilal', done: false },
    { id: '2', text: 'Input Nilai Kelas 4 Ubay', done: false },
    { id: '3', text: 'Les Senin', done: true },
  ])
  const [newTodo, setNewTodo] = useState('')
  const [showManual, setShowManual] = useState(false)

  const formatActivityTime = (date: Date): string => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterday = today - 86400000
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    
    if (compareDate === today) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
    } else if (compareDate === yesterday) {
      return 'Kemarin'
    } else {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
    }
  }

  const fetchDashboardData = () => {
    const localClasses = getSync('tahfidz_classes').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localLessons = getSync('tahfidz_lesson_groups').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localPrivates = getSync('tahfidz_private_students').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localStudents = getSync('tahfidz_students').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localMems = getSync('tahfidz_memorization_records').filter((x:any) => x.guru_id === activeWorkspaceId)

    
    const today = new Date().toLocaleDateString('id-ID')
    const todaySetoran = localMems.filter((m: any) => {
      const mDate = new Date(m.created_at || m.date).toLocaleDateString('id-ID')
      return mDate === today
    }).length

    setCounts({
      classes: localClasses.length,
      lessons: localLessons.length,
      privates: localPrivates.length,
      students: localStudents.length,
      setoran: todaySetoran
    })

    // 2. Schedules with auto-migration
    let allSchedules = getSync('tahfidz_schedules')
    let localSchedules = allSchedules.filter((x:any) => x.guru_id === activeWorkspaceId)
    let needsMigration = false
    localSchedules = localSchedules.map((s: any) => {
      // Dynamic Title Enforcement to fix 'Kelas' or 'Kelas Kelas' issues
      let betterTitle = s.title
      
      if (s.entity_type === 'sekolah' || s.class_id) {
        const cls = localClasses.find((c: any) => c.id === (s.class_id || s.entity_id))
        if (cls) betterTitle = `Kelas ${cls.name}`
      } else if (s.entity_type === 'les') {
        const les = localLessons.find((l: any) => l.id === s.entity_id)
        if (les) betterTitle = les.name
      } else if (s.entity_type === 'privat') {
        const pvt = localPrivates.find((p: any) => p.id === s.entity_id)
        if (pvt) betterTitle = `Privat ${pvt.name}`
      }

      // Cleanup duplicated "Kelas Kelas" just in case
      if (betterTitle && betterTitle.toLowerCase().startsWith('kelas kelas ')) {
        betterTitle = betterTitle.substring(6)
      }

      const finalTitle = betterTitle || s.title || 'Manual'

      if (!s.start_time && s.startTime) {
        needsMigration = true
        return {
          ...s,
          start_time: s.startTime,
          end_time: s.endTime,
          entity_type: s.entity_type || (s.class_id ? 'sekolah' : 'manual'),
          title: finalTitle,
          color: s.color || 'green'
        }
      }
      
      return {
        ...s,
        title: finalTitle
      }
    })
    
    if (needsMigration) {
      // only update the filtered ones back into the main array if we were saving, but here we just update all.
      // To be safe, we don't migrate here if it's filtered to avoid overwriting others.
    }
    
    setSchedules(localSchedules as Schedule[])

    // 3. Todos
    const allTodos = getSync('tahfidz_todos')
    let localTodos = allTodos.filter((x:any) => x.guru_id === activeWorkspaceId)
    
    // Cleanup old completed todos (24 hours)
    try {
      const timestamps = JSON.parse(localStorage.getItem('tahfidz_todo_timestamps') || '{}')
      const nowMs = Date.now()
      let modified = false
      localTodos = localTodos.filter((t: any) => {
        if (t.done && timestamps[t.id]) {
          const ageMs = nowMs - timestamps[t.id]
          if (ageMs > 24 * 60 * 60 * 1000) {
            // Delete from Supabase in background
            mutateData('todos', 'DELETE', { id: t.id }, 'tahfidz_todos').catch(console.error)
            delete timestamps[t.id]
            modified = true
            return false // filter out
          }
        }
        return true
      })
      if (modified) {
        localStorage.setItem('tahfidz_todo_timestamps', JSON.stringify(timestamps))
      }
    } catch (e) {
      console.error(e)
    }

    setTodos(localTodos)

    // 4. Weekly stats (Target = sum over all scheduled entities of: students * meetings)
    let totalTarget = 0
    localClasses.forEach((c: any) => {
      const studentsInClass = localStudents.filter((s: any) => s.class_id === c.id && s.name).length
      const meetingsPerWeek = localSchedules.filter((sch: any) => sch.class_id === c.id).length
      totalTarget += studentsInClass * meetingsPerWeek
    })

    const localLessonStudents = getSync('tahfidz_lesson_students')
    localLessons.forEach((g: any) => {
      const studentsInGroup = localLessonStudents.filter((s: any) => s.group_id === g.id).length
      const meetingsPerWeek = localSchedules.filter((sch: any) => sch.entity_type === 'les' && sch.entity_id === g.id).length
      totalTarget += studentsInGroup * meetingsPerWeek
    })

    const privateMeetings = localSchedules.filter((sch: any) => sch.entity_type === 'privat').length
    totalTarget += privateMeetings

    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const startOfWeek = new Date(now.setDate(diff))
    startOfWeek.setHours(0, 0, 0, 0)

    const weeklySetoran = localMems.filter((m: any) => {
      const mDate = new Date(m.created_at || m.date)
      return mDate >= startOfWeek
    }).length

    const pct = totalTarget > 0 ? Math.round((weeklySetoran / totalTarget) * 100) : 0
    setWeeklyStats({ target: totalTarget, setoran: weeklySetoran, pct })

    // 5. Recent activities
    const localAtts = getSync('tahfidz_attendance_records')
    const activities: { id: string; time: string; desc: string; rawDate: Date }[] = []
    
    localMems.forEach((m: any) => {
      const date = new Date(m.created_at || m.date)
      activities.push({
        id: m.id || `act-mem-${date.getTime()}-${Math.random()}`,
        time: formatActivityTime(date),
        desc: `<strong>${m.student_name || 'Siswa'}</strong> setor ${m.surah_name || m.surah || ''} ${m.verse_start || ''}-${m.verse_end || ''}`,
        rawDate: date
      })
    })
    
    localAtts.forEach((a: any) => {
      if (a.status !== 'hadir') {
        const date = new Date(a.created_at || a.date)
        const statusLabel = a.status === 'izin' ? 'Izin' : a.status === 'sakit' ? 'Sakit' : 'Belum Hadir'
        activities.push({
          id: a.id || `act-att-${date.getTime()}-${Math.random()}`,
          time: formatActivityTime(date),
          desc: `<strong>${a.student_name || 'Siswa'}</strong> ditandai ${statusLabel}`,
          rawDate: date
        })
      }
    })
    
    activities.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    setRecentActivities(activities.slice(0, 3))

    // 6. Alerts (Attention warnings based on actual absent records and unconfigured schedules)
    const absentCounts: Record<string, { name: string; count: number; className: string }> = {}
    localAtts.forEach((a: any) => {
      if (a.status === 'alpa' || a.status === 'izin' || a.status === 'sakit') {
        if (!absentCounts[a.student_id]) {
          const cls = localClasses.find((c: any) => c.id === a.class_id)
          absentCounts[a.student_id] = { name: a.student_name, count: 0, className: cls?.name || 'Kelas' }
        }
        absentCounts[a.student_id].count++
      }
    })
    
    const activeAlerts: any[] = []
    
    localClasses.forEach((c: any) => {
      const hasSch = localSchedules.some((s: any) => s.class_id === c.id)
      if (!hasSch) {
        activeAlerts.push({
          title: `Kelas ${c.name}`,
          message: 'Jadwal belum diatur.'
        })
      }
    })

    Object.values(absentCounts)
      .filter((item: any) => item.count >= 2)
      .forEach((item: any) => {
        activeAlerts.push({
          title: item.className,
          message: `${item.name} absen ${item.count} kali pertemuan.`
        })
      })

    setAlerts(activeAlerts)
    
    // Background SWR Fetches
    if (navigator.onLine) {
      Promise.all([
        fetchBackground('school_classes', 'tahfidz_classes', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('lesson_groups', 'tahfidz_lesson_groups', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('private_students', 'tahfidz_private_students', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('students', 'tahfidz_students', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('memorization_records', 'tahfidz_memorization_records', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('attendance', 'tahfidz_attendance_records', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
      ]).catch(console.error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const handleUpdate = () => fetchDashboardData()
    window.addEventListener('local_cache_updated', handleUpdate)
    return () => window.removeEventListener('local_cache_updated', handleUpdate)
  }, [activeWorkspaceId])

  useEffect(() => {
    const hour = now.getHours()
    if (hour < 12) setGreeting('Selamat Pagi')
    else if (hour < 15) setGreeting('Selamat Siang')
    else if (hour < 18) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')
  }, [now])

  // Derived Schedule Logic
  const todayStr = DAYS[now.getDay()]
  
  // Calculate current week dates (Monday to Sunday)
  const currentDayOfWeek = now.getDay()
  const diffToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(monday.getDate() - diffToMonday)
  
  const weekDates = Array.from({length: 7}).map((_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  // Apply filters logic
  const filteredSchedules = schedules.filter(s => 
    scheduleFilter === 'Semua' ? true : s.entity_type === scheduleFilter.toLowerCase()
  )

  const dailySchedules = filteredSchedules
    .filter(s => s.day === todayStr)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  // Determine current/next meeting
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  let activeMeeting: Schedule | null = null
  let nextMeeting: Schedule | null = null

  for (const s of dailySchedules) {
    const sStart = parseInt(s.start_time.split(':')[0]) * 60 + parseInt(s.start_time.split(':')[1])
    const sEnd = parseInt(s.end_time.split(':')[0]) * 60 + parseInt(s.end_time.split(':')[1])
    
    if (currentMinutes >= sStart && currentMinutes <= sEnd) {
      activeMeeting = s
      break
    }
    if (currentMinutes < sStart && !nextMeeting) {
      nextMeeting = s
    }
  }

  const getStatus = (start: string, end: string) => {
    const sStart = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1])
    const sEnd = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1])
    if (currentMinutes < sStart) return { label: 'Belum Dimulai', class: styles.status_belum }
    if (currentMinutes >= sStart && currentMinutes <= sEnd) return { label: 'Sedang Berlangsung', class: styles.status_sedang }
    return { label: 'Selesai', class: styles.status_selesai }
  }

  // Todo Handlers
  const [isAddingTodo, setIsAddingTodo] = useState(false)

  const toggleTodo = async (id: string) => {
    const todoToToggle = todos.find(t => t.id === id)
    if (!todoToToggle) return

    const newDoneState = !todoToToggle.done
    
    // Save timestamp for auto-deletion after 24h
    try {
      const timestamps = JSON.parse(localStorage.getItem('tahfidz_todo_timestamps') || '{}')
      if (newDoneState) {
        timestamps[id] = Date.now()
      } else {
        delete timestamps[id]
      }
      localStorage.setItem('tahfidz_todo_timestamps', JSON.stringify(timestamps))
    } catch (e) {
      console.error(e)
    }

    // Optimistic UI Update
    const newTodos = todos.map(t => {
      if (t.id === id) return { ...t, done: newDoneState }
      return t
    })
    setTodos(newTodos)

    // Save to DB
    const res = await mutateData('todos', 'UPDATE', { id, done: newDoneState }, 'tahfidz_todos')
    if (res.success) {
      toast.success('Status To Do diperbarui', { duration: 1500 })
    } else {
      toast.error('Gagal memperbarui To Do')
      // Rollback UI (handled automatically by local_cache_updated event via fetchDashboardData, but we can also force it if needed)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault() // PREVENT FULL PAGE RELOAD!
    if (!newTodo.trim() || isAddingTodo) return
    
    setIsAddingTodo(true)
    const todo = { id: `todo-${Date.now()}`, text: newTodo, done: false, guru_id: activeWorkspaceId }
    
    // Optimistic Update
    setTodos([...todos, todo])
    setNewTodo('') // Clear input immediately
    
    const res = await mutateData('todos', 'INSERT', todo, 'tahfidz_todos')
    if (res.success) {
      toast.success('To Do ditambahkan!')
    } else {
      toast.error('Gagal menyimpan To Do')
      // If error, rollback UI state
      setTodos(todos) 
    }
    setIsAddingTodo(false)
  }

  const deleteTodo = async (id: string) => {
    // Optimistic UI Update
    const oldTodos = [...todos]
    setTodos(todos.filter(t => t.id !== id))
    
    // Save to DB
    const res = await mutateData('todos', 'DELETE', { id }, 'tahfidz_todos')
    if (res.success) {
      toast.success('To Do dihapus')
    } else {
      toast.error('Gagal menghapus To Do')
      setTodos(oldTodos) // rollback
    }
  }

  const handleMasukKelas = (sched: Schedule | null) => {
    if (!sched) return;
    // Check if it's a school class
    if (sched.entity_type === 'sekolah' && sched.class_id) {
      navigate(`/sekolah/${sched.class_id}`)
    } else if (sched.entity_type === 'sekolah' && !sched.class_id && sched.entity_id && sched.entity_id !== 'manual') {
      navigate(`/sekolah/${sched.entity_id}`)
    } else {
      // Fallback for non-school or manual schedules
      alert(`Masuk ke: ${sched.title}`)
    }
  }

  return (
    <div className={`${styles.page} page-enter`}>
      {/* ── 1. HEADER & GREETING ── */}
      <div className={styles.greetHeader}>
        <div className={styles.greetBg} />
        <div className={styles.greetContent}>
          <div className={styles.greetLeft}>
            <p className={styles.salam}>Assalamu'alaikum,</p>
            <h1 className={styles.greetName}>{profile?.name ?? 'Ust. Tammam Sholahudin'}</h1>
            <div className={styles.greetMeta}>
              <span className={styles.greetTag}>
                <CalendarIcon size={14} />
                {todayStr}, {formatTanggal(now)}
              </span>
              <span className={styles.greetTag}>
                <Clock size={14} />
                {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
            </div>
            <p className={styles.greetSub}>{greeting}, semoga hari ini produktif dan berkah.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button onClick={() => navigate('/aktivitas')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                <Bell size={20} />
              </button>
              <button onClick={() => navigate('/pengaturan')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                <Settings size={20} />
              </button>
            </div>
            <div className={styles.greetAvatar}>
              {profile?.photo_url
                ? <img src={profile.photo_url} alt={profile.name} />
                : <span className={styles.avatarInitial}>{profile?.name?.charAt(0) ?? 'G'}</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. QUICK ACTION ── */}
      <div className={styles.quickActionWrap}>
        <div className={styles.quickGrid}>
          <button className={styles.quickBtn} onClick={() => alert('Buka Modal Mulai Pertemuan')}>
            <div className={styles.quickIcon}><Clock size={24} /></div>
            <span className={styles.quickLabel}>Mulai Pertemuan</span>
          </button>
          <button className={styles.quickBtn} onClick={() => setShowManual(true)}>
            <div className={styles.quickIcon}><CalendarIcon size={24} /></div>
            <span className={styles.quickLabel}>Tambah Jadwal</span>
          </button>
          <Link to="/les" className={styles.quickBtn} style={{ textDecoration: 'none' }}>
            <div className={styles.quickIcon}><Users size={24} /></div>
            <span className={styles.quickLabel}>Tambah Les</span>
          </Link>
          <Link to="/privat" className={styles.quickBtn} style={{ textDecoration: 'none' }}>
            <div className={styles.quickIcon}><Home size={24} /></div>
            <span className={styles.quickLabel}>Tambah Privat</span>
          </Link>
          <button className={styles.quickBtn} onClick={() => alert('Buka Modal Laporan')}>
            <div className={styles.quickIcon}><FileText size={24} /></div>
            <span className={styles.quickLabel}>Lihat Laporan</span>
          </button>
        </div>
      </div>

      <div className="content-area">
        
        {/* ── 3. RINGKASAN HARI INI ── */}
        <div className={styles.section}>
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.card_green}`}>
              <div className={styles.cardTitle}>🏫 Sekolah</div>
              <div className={styles.cardValue}>{counts.classes}</div>
            </div>
            <div className={`${styles.statCard} ${styles.card_blue}`}>
              <div className={styles.cardTitle}>👥 Les</div>
              <div className={styles.cardValue}>{counts.lessons}</div>
            </div>
            <div className={`${styles.statCard} ${styles.card_purple}`}>
              <div className={styles.cardTitle}>👤 Privat</div>
              <div className={styles.cardValue}>{counts.privates}</div>
            </div>
            <div className={`${styles.statCard} ${styles.card_teal}`}>
              <div className={styles.cardTitle}>👨‍🎓 Siswa</div>
              <div className={styles.cardValue}>{counts.students}</div>
            </div>
            <div className={`${styles.statCard} ${styles.card_gold}`}>
              <div className={styles.cardTitle}>📖 Setoran</div>
              <div className={styles.cardValue}>{counts.setoran}</div>
            </div>
          </div>
        </div>

        <div className={styles.dashboardGrid}>
          
          {/* LEFT COLUMN: Main Timelines */}
          <div>
            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  <CalendarIcon size={20} /> Jadwal Saya
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn-outline" onClick={() => exportToICS(filteredSchedules)} style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--clr-info)', color: 'var(--clr-info)' }}>
                    Sinkron Google Kalender
                  </button>
                  <div className={styles.tabWrap} style={{ margin: 0, border: 'none' }}>
                    <button className={`${styles.tab} ${scheduleTab === 'day' ? styles.tabActive : ''}`} onClick={() => setScheduleTab('day')}>Day</button>
                    <button className={`${styles.tab} ${scheduleTab === 'week' ? styles.tabActive : ''}`} onClick={() => setScheduleTab('week')}>Week</button>
                    <button className={`${styles.tab} ${scheduleTab === 'month' ? styles.tabActive : ''}`} onClick={() => setScheduleTab('month')}>Month</button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className={styles.filterWrap}>
                {['Semua', 'Sekolah', 'Les', 'Privat', 'Manual'].map(f => (
                  <button 
                    key={f} 
                    className={`${styles.filterTag} ${scheduleFilter === f ? styles.filterTagActive : ''}`}
                    onClick={() => setScheduleFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {scheduleTab === 'day' ? (
                <div>
                  {dailySchedules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-6)', background: 'white', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ color: 'var(--clr-gray-400)' }}>Tidak ada jadwal hari ini.</p>
                    </div>
                  ) : (
                    dailySchedules.map(s => {
                      const stat = getStatus(s.start_time, s.end_time)
                      return (
                        <div key={s.id} className={styles.agendaCard}>
                          <div className={styles.agendaIndicator} style={{ background: `var(--clr-${s.color}-500)` }} />
                          <div className={styles.timeCol}>
                            <span>{s.start_time}</span>
                            <span className={styles.timeSub}>{s.end_time}</span>
                          </div>
                          <div className={styles.agendaBody}>
                            <div className={styles.agendaType} style={{ color: `var(--clr-${s.color}-600)` }}>
                              {s.entity_type === 'sekolah' ? <School size={12}/> : 
                               s.entity_type === 'les' ? <Users size={12}/> : 
                               s.entity_type === 'privat' ? <Home size={12}/> : <Clock size={12}/>}
                              {s.entity_type}
                            </div>
                            <div className={styles.agendaTitle}>{s.title}</div>
                            {s.location && (
                              <div className={styles.agendaLoc}><MapPin size={12}/> {s.location}</div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span className={`${styles.agendaStatus} ${stat.class}`}>{stat.label}</span>
                            {stat.label !== 'Selesai' && (
                              <button 
                                className="btn-primary" 
                                style={{ fontSize: '10px', padding: '4px 8px' }}
                                onClick={() => handleMasukKelas(s)}
                              >
                                {stat.label === 'Sedang Berlangsung' ? 'Masuk Pertemuan' : 'Lihat Kelas'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              ) : scheduleTab === 'week' ? (
                <div className={scheduleStyles.calendarBody} style={{ padding: 0, background: 'white', minHeight: '400px', borderRadius: 'var(--radius-lg)' }}>
                  <div className={scheduleStyles.weekGrid}>
                    <div className={scheduleStyles.daysRow}>
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d, i) => {
                        const dateNum = weekDates[i].getDate()
                        const isActive = d === todayStr && weekDates[i].getDate() === now.getDate()
                        return (
                          <div key={d} className={scheduleStyles.dayColHeader}>
                            {isActive && <div className={scheduleStyles.activeDot} />}
                            <span className={scheduleStyles.dayName}>{d}</span>
                            <span className={`${scheduleStyles.dayNum} ${isActive ? scheduleStyles.active : ''}`}>{dateNum}</span>
                          </div>
                        )
                      })}
                    </div>

                    <div className={scheduleStyles.timeGridWrap}>
                      <div className={scheduleStyles.timeLabels}>
                        {Array.from({ length: 11 }, (_, i) => i + 7).map(h => {
                          const ampm = h >= 12 ? 'PM' : 'AM'
                          const hour12 = h > 12 ? h - 12 : h
                          return (
                            <div key={h} className={scheduleStyles.timeLabel}>
                              {hour12} {ampm}
                            </div>
                          )
                        })}
                      </div>
                      
                      <div className={scheduleStyles.gridLines}>
                        {Array.from({ length: 11 }, (_, i) => i + 7).map(h => (
                          <div key={h} className={scheduleStyles.gridLineRow} />
                        ))}

                        <div className={scheduleStyles.eventsColumns}>
                          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => (
                            <div key={d} className={scheduleStyles.eventCol}>
                              {filteredSchedules.filter(s => s.day === d).map(s => {
                                const [startH, startM] = s.start_time.split(':').map(Number)
                                const [endH, endM] = s.end_time.split(':').map(Number)
                                const topPx = ((startH - 7) * 60) + startM
                                const durationMins = ((endH * 60) + endM) - ((startH * 60) + startM)
                                
                                return (
                                  <div 
                                    key={s.id} 
                                    className={scheduleStyles.eventCard} 
                                    style={{
                                      top: `${topPx}px`,
                                      height: `${durationMins}px`,
                                      borderLeftColor: `var(--clr-${s.color}-500)`
                                    }}
                                  >
                                    <div className={scheduleStyles.eventEntity}>{s.title}</div>
                                    <div className={scheduleStyles.eventRoom}>
                                      {s.entity_type === 'sekolah' ? 'Kelas' : s.entity_type === 'les' ? 'Grup Les' : s.entity_type === 'privat' ? 'Privat' : 'Manual'} 
                                      {s.location ? ` - ${s.location}` : ''}
                                    </div>
                                    <div className={scheduleStyles.eventTime}>
                                      <Clock size={10} /> {s.start_time} - {s.end_time}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={scheduleStyles.calendarBody} style={{ padding: 0, background: 'white', minHeight: '500px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map(d => (
                      <div key={d} style={{ padding: '16px 8px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#64748b', letterSpacing: '0.5px' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#f1f5f9', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    {(() => {
                      const now = new Date()
                      const currentMonth = now.getMonth()
                      const currentYear = now.getFullYear()
                      const currentDay = now.getDate()
                    
                      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
                      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
                      const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()
                    
                      const monthGrid = []
                      for (let i = firstDayOfMonth - 1; i >= 0; i--) monthGrid.push({ date: daysInPrevMonth - i, isCurrentMonth: false })
                      for (let i = 1; i <= daysInMonth; i++) monthGrid.push({ date: i, isCurrentMonth: true })
                      const totalCells = monthGrid.length > 35 ? 42 : 35
                      const extraCells = totalCells - monthGrid.length
                      for (let i = 1; i <= extraCells; i++) monthGrid.push({ date: i, isCurrentMonth: false })

                      const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

                      return monthGrid.map((cell, i) => {
                        const dayName = daysOfWeek[i % 7]
                        const dayEvents = filteredSchedules.filter(s => s.day === dayName).sort((a,b) => a.start_time.localeCompare(b.start_time))
                        const isToday = cell.isCurrentMonth && cell.date === currentDay

                        return (
                          <div key={i} style={{ 
                            background: isToday ? '#eef2ff' : 'white', 
                            minHeight: '120px', 
                            padding: '8px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '4px',
                            position: 'relative'
                          }}>
                            {/* Date Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              {isToday ? (
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                              ) : <div />}
                              
                              <div style={{
                                width: '26px', height: '26px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '50%',
                                fontSize: '14px',
                                fontWeight: isToday ? '600' : '400',
                                color: isToday ? '#3730a3' : (cell.isCurrentMonth ? '#334155' : '#cbd5e1'),
                                background: isToday ? '#c7d2fe' : 'transparent'
                              }}>
                                {cell.date}
                              </div>
                            </div>

                            {/* Events */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {dayEvents.map((s, idx) => {
                                const colors: Record<string, { bg: string, border: string, text: string }> = {
                                  purple: { bg: '#e0e7ff', border: '#4338ca', text: '#4338ca' },
                                  gold:   { bg: '#ffedd5', border: '#c2410c', text: '#c2410c' },
                                  green:  { bg: '#dcfce7', border: '#15803d', text: '#15803d' },
                                  blue:   { bg: '#dbeafe', border: '#1d4ed8', text: '#1d4ed8' },
                                  teal:   { bg: '#ccfbf1', border: '#0f766e', text: '#0f766e' },
                                  red:    { bg: '#fee2e2', border: '#b91c1c', text: '#b91c1c' },
                                }
                                const evStyle = colors[s.color || 'green'] || colors.green
                                
                                return (
                                  <div key={idx} style={{ 
                                    background: evStyle.bg, 
                                    color: evStyle.text, 
                                    borderLeft: `3px solid ${evStyle.border}`, 
                                    fontSize: '10.5px', 
                                    fontWeight: '500',
                                    padding: '4px 6px', 
                                    borderRadius: '4px', 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis' 
                                  }}>
                                    <span style={{ opacity: 0.7, marginRight: '4px' }}>{s.start_time}</span>
                                    {s.title}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Widgets */}
          <div>
            {/* Next Meeting */}
            <div className={styles.nextMeeting}>
              <h3>{activeMeeting ? 'Sedang Berlangsung' : 'Pertemuan Berikutnya'}</h3>
              {activeMeeting || nextMeeting ? (
                <>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '4px' }}>
                    {(activeMeeting || nextMeeting)?.title}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginBottom: 'var(--space-3)' }}>
                    {(activeMeeting || nextMeeting)?.start_time} - {(activeMeeting || nextMeeting)?.end_time}
                  </div>
                  <button 
                    className="btn-primary" 
                    style={{ width: '100%', background: 'white', color: 'var(--clr-primary-600)' }}
                    onClick={() => handleMasukKelas(activeMeeting || nextMeeting)}
                  >
                    {activeMeeting ? 'Masuk Pertemuan' : 'Lihat Kelas'}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>Tidak ada jadwal tersisa hari ini.</div>
              )}
            </div>

            {/* Progress Mingguan */}
            <div className={styles.widgetCard}>
              <h3 className={styles.widgetTitle}><TrendingUp size={16}/> Progress Mingguan</h3>
              <div className={styles.progWrap}>
                <div className={styles.progInfo}>
                  <span>Target: {weeklyStats.target} Setoran</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--clr-primary-600)' }}>{weeklyStats.pct}%</span>
                </div>
                <div className={styles.progBar}>
                  <div className={styles.progFill} style={{ width: `${Math.min(weeklyStats.pct, 100)}%` }} />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-500)', marginTop: '4px' }}>Setoran Masuk: {weeklyStats.setoran}</div>
              </div>
            </div>

            {/* Perlu Perhatian */}
            <div className={styles.widgetCard}>
              <h3 className={styles.widgetTitle} style={{ color: 'var(--clr-warning)' }}><AlertTriangle size={16}/> Perlu Perhatian</h3>
              <div className={styles.alertList}>
                {alerts.length === 0 ? (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-400)', padding: 'var(--space-1) 0' }}>
                    Semua aktivitas kelas berjalan lancar.
                  </div>
                ) : (
                  alerts.slice(0, 3).map((a, idx) => (
                    <div key={idx} className={styles.alertItem}>
                      <AlertTriangle size={16} color="var(--clr-warning)" style={{ marginTop: '2px' }}/>
                      <div>
                        <h4>{a.title}</h4>
                        <p>{a.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* To-Do Guru */}
            <div className={styles.widgetCard}>
              <h3 className={styles.widgetTitle}><CheckCircle2 size={16}/> To-Do Guru</h3>
              <div className={styles.todoList}>
                {todos.map(t => (
                  <div key={t.id} className={styles.todoItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '4px', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, margin: 0 }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} style={{ margin: 0 }} />
                      <span className={`${styles.todoText} ${t.done ? styles.todoDone : ''}`} style={{ flex: 1 }}>{t.text}</span>
                    </label>
                    <button 
                      onClick={() => deleteTodo(t.id)} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--clr-gray-400)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      title="Hapus To Do"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={addTodo} className={styles.todoAdd}>
                <input 
                  type="text" 
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  placeholder="Tambah tugas baru..." 
                  className="form-input" 
                  style={{ fontSize: 'var(--text-xs)', padding: '6px' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '6px 10px' }} disabled={isAddingTodo}>
                  {isAddingTodo ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14}/>}
                </button>
              </form>
            </div>

            {/* Aktivitas Terakhir */}
            <div className={styles.widgetCard}>
              <h3 className={styles.widgetTitle}><Clock size={16}/> Aktivitas Terakhir</h3>
              <div className={styles.activityLog}>
                {recentActivities.length === 0 ? (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-400)', padding: 'var(--space-1) 0' }}>
                    Belum ada aktivitas setoran hari ini.
                  </div>
                ) : (
                  recentActivities.map((act) => (
                    <div key={act.id} className={styles.actItem}>
                      <span className={styles.actTime}>{act.time}</span>
                      <span className={styles.actDesc} dangerouslySetInnerHTML={{ __html: act.desc }} />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {showManual && (
        <SetJadwalModal
          entityType="manual"
          onClose={() => setShowManual(false)}
          onSuccess={() => {
            setShowManual(false)
            fetchDashboardData()
          }}
        />
      )}
    </div>
  )
}
