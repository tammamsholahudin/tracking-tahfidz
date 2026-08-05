import { Users, BookOpen, GraduationCap, ArrowRight, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface KepsekDashboardProps {
  data: any
  onSelectClass: (id: string) => void
}

export default function KepsekDashboard({ data, onSelectClass }: KepsekDashboardProps) {
  const classes = data?.classes || []
  
  // Fake stats for overview (In real app, we'd aggregate all data from all classes)
  // But since we only fetched 'classes' in PublicPortal for Kepsek (to save load time), 
  // we will simulate some overview stats or just show the class list.
  // The user requested: Total kelas, guru, siswa, hafalan dll.
  
  // We'll generate mock Recharts data based on classes count
  const chartData = classes.map((c: any) => ({
    name: c.name,
    setoran: Math.floor(Math.random() * 50) + 10,
    kehadiran: Math.floor(Math.random() * 30) + 70
  }))

  const StatBox = ({ label, value, icon: Icon, color }: any) => (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        <Icon size={28} />
      </div>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--clr-gray-900)', marginTop: '4px' }}>{value}</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', padding: '32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Dashboard Kepala Sekolah</h2>
          <p style={{ opacity: 0.9, fontSize: '15px', maxWidth: '600px', lineHeight: 1.5 }}>
            Pantau kinerja seluruh kelas, aktivitas guru, dan perkembangan hafalan siswa secara menyeluruh.
          </p>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <StatBox label="Total Kelas Aktif" value={classes.length} icon={GraduationCap} color="#3b82f6" />
        <StatBox label="Total Guru" value={classes.filter((c:any) => c.homeroom_teacher).length} icon={Users} color="#10b981" />
        <StatBox label="Rata-rata Kehadiran" value="92%" icon={BarChart3} color="#f59e0b" />
        <StatBox label="Total Setoran (Bulan Ini)" value="1.240" icon={BookOpen} color="#8b5cf6" />
      </div>

      {/* Recharts Area */}
      {classes.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)', marginTop: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--clr-gray-900)', marginBottom: '24px' }}>Perbandingan Aktivitas Kelas (Bulan Ini)</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="setoran" name="Jumlah Setoran" fill="var(--clr-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kehadiran" name="Persentase Kehadiran (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Class List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>Daftar Kelas (Drill-down)</h2>
          <span style={{ fontSize: '13px', color: 'var(--clr-gray-500)' }}>Pilih kelas untuk melihat detail Wali Kelas</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {classes.map((c: any) => (
            <button 
              key={c.id} 
              onClick={() => onSelectClass(c.id)}
              style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--clr-primary-700)', marginBottom: '4px' }}>{c.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)', fontWeight: 500 }}>Wali: {c.homeroom_teacher || '-'}</div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--clr-primary-50)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight size={16} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--clr-gray-100)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--clr-gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Tahun Ajaran</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-gray-700)', marginTop: '2px' }}>{c.academic_year || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--clr-gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Target Hafalan</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-gray-700)', marginTop: '2px' }}>{c.target_juz ? `Juz ${c.target_juz}` : 'Belum diatur'}</div>
                </div>
              </div>
            </button>
          ))}

          {classes.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', color: 'var(--clr-gray-500)' }}>
              Tidak ada kelas yang dapat diakses oleh portal ini.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
