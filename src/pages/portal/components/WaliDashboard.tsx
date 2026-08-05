import { Users, CalendarCheck, BookOpen, Target, TrendingUp, Award } from 'lucide-react'

interface WaliDashboardProps {
  data: any
}

export default function WaliDashboard({ data }: WaliDashboardProps) {
  const students = data?.students || []
  const classInfo = data?.class_info
  const meetings = data?.meetings || []
  const attendance = data?.attendanceData || []
  const memorizations = data?.memorizationData || []

  // Calculate today's date string (local)
  const today = new Date().toISOString().split('T')[0]
  
  // Kehadiran hari ini
  const todayMeeting = meetings.find((m: any) => m.date.startsWith(today))
  let presentToday = 0
  if (todayMeeting) {
    const meetingId = todayMeeting.id
    presentToday = attendance.filter((a: any) => a.meeting_id === meetingId && a.status === 'hadir').length
  }

  // Total setoran hari ini
  const todaySetoran = memorizations.filter((m: any) => m.date && m.date.startsWith(today)).length

  // Stats Card Component
  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        <Icon size={28} />
      </div>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--clr-gray-900)', marginTop: '4px' }}>{value}</div>
        {subtitle && <div style={{ fontSize: '13px', color: 'var(--clr-gray-400)', marginTop: '4px' }}>{subtitle}</div>}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-primary-700) 100%)', borderRadius: '20px', padding: '32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Selamat Datang di Portal Kelas</h2>
          <p style={{ opacity: 0.9, fontSize: '15px', maxWidth: '600px', lineHeight: 1.5 }}>
            Pantau perkembangan hafalan, setoran harian, serta kehadiran siswa Kelas {classInfo?.name} secara real-time. Data ini bersifat Read-Only.
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px 24px', borderRadius: '16px', backdropFilter: 'blur(10px)', textAlign: 'center', display: 'none' /* visible on desktop via CSS, inline style limit */ }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: 600 }}>Tahun Ajaran</div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{classInfo?.academic_year}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <StatCard 
          title="Total Siswa" 
          value={students.length} 
          subtitle={`Kelas ${classInfo?.name}`}
          icon={Users} 
          color="#3b82f6" 
        />
        <StatCard 
          title="Kehadiran Hari Ini" 
          value={`${presentToday} / ${students.length}`} 
          subtitle={todayMeeting ? 'Dari total siswa' : 'Belum ada pertemuan hari ini'}
          icon={CalendarCheck} 
          color="#10b981" 
        />
        <StatCard 
          title="Setoran Hari Ini" 
          value={todaySetoran} 
          subtitle="Total hafalan disetorkan"
          icon={BookOpen} 
          color="#f59e0b" 
        />
        <StatCard 
          title="Target Kelas" 
          value={classInfo?.target_juz ? `Juz ${classInfo.target_juz}` : 'Belum diatur'} 
          subtitle="Target akhir tahun"
          icon={Target} 
          color="#8b5cf6" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '8px' }}>
        
        {/* Quick Info */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award size={20} color="var(--clr-primary)" /> Informasi Kelas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--clr-gray-100)' }}>
              <span style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>Wali Kelas</span>
              <span style={{ fontWeight: 600, color: 'var(--clr-gray-800)' }}>{classInfo?.homeroom_teacher || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--clr-gray-100)' }}>
              <span style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>Total Pertemuan</span>
              <span style={{ fontWeight: 600, color: 'var(--clr-gray-800)' }}>{meetings.length} Sesi</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>Total Seluruh Setoran</span>
              <span style={{ fontWeight: 600, color: 'var(--clr-gray-800)' }}>{memorizations.length} Kali</span>
            </div>
          </div>
        </div>

        {/* Placeholder for small chart or insight */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)' }}>
           <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={20} color="#3b82f6" /> Aktivitas Terakhir
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'var(--clr-gray-400)', fontSize: '14px', fontStyle: 'italic', background: 'var(--clr-gray-50)', borderRadius: '8px' }}>
            Silakan lihat menu Progress & Setoran untuk detailnya.
          </div>
        </div>
      </div>

    </div>
  )
}
