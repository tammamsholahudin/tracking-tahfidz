import { useState } from 'react'
import { Calendar, Users, ChevronRight, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react'

interface WaliAbsensiProps {
  data: any
}

export default function WaliAbsensi({ data }: WaliAbsensiProps) {
  const meetings = [...(data?.meetings || [])].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const attendance = data?.attendanceData || []
  const students = data?.students || []

  const [selectedMeeting, setSelectedMeeting] = useState<any>(meetings[0] || null)

  const getMeetingStats = (meetingId: string) => {
    const meetingAtt = attendance.filter((a: any) => a.meeting_id === meetingId)
    const hadir = meetingAtt.filter((a: any) => a.status === 'hadir').length
    const izin = meetingAtt.filter((a: any) => a.status === 'izin').length
    const sakit = meetingAtt.filter((a: any) => a.status === 'sakit').length
    const alfa = meetingAtt.filter((a: any) => a.status === 'alfa').length
    return { hadir, izin, sakit, alfa, total: meetingAtt.length }
  }

  const selectedStats = selectedMeeting ? getMeetingStats(selectedMeeting.id) : { hadir:0, izin:0, sakit:0, alfa:0, total:0 }

  const StatBox = ({ label, value, color, icon: Icon }: any) => (
    <div style={{ flex: 1, background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={24} color={color} style={{ marginBottom: '8px' }} />
      <div style={{ fontSize: '24px', fontWeight: 800, color: color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: color, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{label}</div>
    </div>
  )

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'hadir': return <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><CheckCircle2 size={16}/> Hadir</span>
      case 'izin': return <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><Clock size={16}/> Izin</span>
      case 'sakit': return <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><AlertCircle size={16}/> Sakit</span>
      case 'alfa': return <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><XCircle size={16}/> Alfa</span>
      default: return <span style={{ color: 'var(--clr-gray-400)' }}>-</span>
    }
  }

  return (
    <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
      
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>Riwayat Kehadiran</h2>
        <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginTop: '4px' }}>Klik pada tanggal pertemuan untuk melihat detail absensi siswa.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Left: Meeting Timeline */}
        <div style={{ flex: '1 1 300px', background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
          <div style={{ padding: '16px 20px', background: 'var(--clr-gray-50)', borderBottom: '1px solid var(--clr-gray-200)', fontWeight: 600, fontSize: '14px', color: 'var(--clr-gray-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} /> Daftar Pertemuan
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
            {meetings.map((m: any) => {
              const isSelected = selectedMeeting?.id === m.id
              const dateObj = new Date(m.date)
              return (
                <button 
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  style={{ width: '100%', textAlign: 'left', padding: '16px', borderRadius: '12px', border: isSelected ? '1px solid var(--clr-primary)' : '1px solid transparent', background: isSelected ? 'var(--clr-primary-50)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}
                >
                  <div>
                    <div style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--clr-primary)' : 'var(--clr-gray-800)', fontSize: '15px' }}>
                      Pertemuan {dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: '13px', color: isSelected ? 'var(--clr-primary)' : 'var(--clr-gray-500)', marginTop: '4px' }}>
                      {dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <ChevronRight size={18} color={isSelected ? 'var(--clr-primary)' : 'var(--clr-gray-400)'} />
                </button>
              )
            })}
            {meetings.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--clr-gray-500)', fontSize: '14px' }}>Belum ada riwayat pertemuan.</div>
            )}
          </div>
        </div>

        {/* Right: Meeting Details */}
        <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {selectedMeeting ? (
            <>
              {/* Stats */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <StatBox label="Hadir" value={selectedStats.hadir} color="#10b981" icon={CheckCircle2} />
                <StatBox label="Izin" value={selectedStats.izin} color="#3b82f6" icon={Clock} />
                <StatBox label="Sakit" value={selectedStats.sakit} color="#f59e0b" icon={AlertCircle} />
                <StatBox label="Alfa" value={selectedStats.alfa} color="#ef4444" icon={XCircle} />
              </div>

              {/* Student List */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: 'var(--clr-gray-50)', borderBottom: '1px solid var(--clr-gray-200)', fontWeight: 600, fontSize: '14px', color: 'var(--clr-gray-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} /> Detail Siswa
                </div>
                <div>
                  {students.map((s: any, i: number) => {
                    const attRecord = attendance.find((a: any) => a.meeting_id === selectedMeeting.id && a.student_id === s.id)
                    const status = attRecord ? attRecord.status : 'unknown'
                    
                    return (
                      <div key={s.id} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < students.length - 1 ? '1px solid var(--clr-gray-100)' : 'none' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--clr-gray-900)', fontSize: '14px' }}>{s.name}</div>
                          <div style={{ color: 'var(--clr-gray-500)', fontSize: '13px', marginTop: '2px' }}>NIS: {s.nis || '-'}</div>
                        </div>
                        <div>
                          {getStatusDisplay(status)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed var(--clr-gray-300)', color: 'var(--clr-gray-400)', padding: '40px' }}>
              Silakan pilih pertemuan di sebelah kiri.
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
