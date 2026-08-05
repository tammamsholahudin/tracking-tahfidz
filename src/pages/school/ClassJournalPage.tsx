import { useState, useEffect } from 'react'
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { getSync } from '@/lib/db'
import toast from 'react-hot-toast'
import { exportAttendancePDF } from '@/lib/pdf'
import { exportJournalExcel } from '@/lib/excel'

export default function ClassJournalPage({ entityId, entityType: _entityType, entityData }: { entityId: string, entityType: string, entityData?: any }) {
  const [meetings, setMeetings] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  useEffect(() => {
    loadData()
    window.addEventListener('local_cache_updated', loadData)
    return () => window.removeEventListener('local_cache_updated', loadData)
  }, [entityId])

  const loadData = () => {
    const allMeetings = getSync('tahfidz_meetings').filter((m: any) => m.class_id === entityId)
    allMeetings.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setMeetings(allMeetings)
  }

  const getMeetingDetails = (meetingId: string) => {
    const att = getSync('tahfidz_attendance_records').filter((a: any) => a.meeting_id === meetingId)
    
    // We try to match memorizations to this meeting by date since memorizations don't have meeting_id explicitly yet
    // Or if they do, we use it. Currently they only have 'date' or 'created_at'.
    const meetingDate = meetings.find(m => m.id === meetingId)?.date
    const mems = getSync('tahfidz_memorization_records').filter((m: any) => {
      // Very naive date matching for now. A better approach would be to add meeting_id to memorizations in the future
      if (m.class_id === entityId) {
        const mDate = new Date(m.created_at || m.date).toDateString()
        const mtgDate = new Date(meetingDate).toDateString()
        return mDate === mtgDate
      }
      return false
    })

    const students = getSync('tahfidz_students').filter((s: any) => s.class_id === entityId)
    
    const rekap = {
      hadir: att.filter((a: any) => a.status === 'hadir').length,
      izin: att.filter((a: any) => a.status === 'izin').length,
      sakit: att.filter((a: any) => a.status === 'sakit').length,
      alpa: att.filter((a: any) => a.status === 'alpa').length,
    }

    return { att, mems, students, rekap }
  }

  const handleExport = (format: string, meeting: any) => {
    toast.success(`Export ${format.toUpperCase()} sedang disiapkan...`)
    if (format === 'excel') {
      exportJournalExcel([meeting], entityData || { name: 'Kelas' }, `Jurnal_${entityData?.name || 'Kelas'}.xlsx`)
    } else if (format === 'pdf') {
      exportAttendancePDF([], entityData || { name: 'Kelas' }, `Jurnal_${entityData?.name || 'Kelas'}.pdf`, [meeting])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
            <FileText size={20} /> Jurnal Pembelajaran
          </h2>
          <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px', margin: 0 }}>
            Rekap jurnal setiap pertemuan kelas
          </p>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px dashed var(--clr-gray-200)' }}>
          <p style={{ color: 'var(--clr-gray-500)' }}>Belum ada pertemuan yang dicatat.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {meetings.map((m, idx) => {
            const isExpanded = expandedId === m.id
            const dateStr = new Date(m.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            return (
              <div key={m.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', overflow: 'hidden' }}>
                <div 
                  style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? 'var(--clr-gray-50)' : 'white' }}
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'var(--clr-primary-100)', color: 'var(--clr-primary-700)', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>
                      Pertemuan {meetings.length - idx}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{dateStr}</div>
                      <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)', marginTop: '4px' }}>
                        {m.summary || 'Tidak ada catatan khusus'}
                      </div>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? <ChevronUp size={20} color="var(--clr-gray-500)" /> : <ChevronDown size={20} color="var(--clr-gray-500)" />}
                  </div>
                </div>

                {isExpanded && (() => {
                  const details = getMeetingDetails(m.id)
                  return (
                    <div style={{ padding: '16px', borderTop: '1px solid var(--clr-gray-200)' }}>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleExport('excel', m) }} className="btn-outline" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} /> Excel
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleExport('pdf', m) }} className="btn-outline" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} /> PDF
                      </button>
                    </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>{details.rekap.hadir}</div>
                          <div style={{ fontSize: '12px', color: '#15803d' }}>Hadir</div>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{details.rekap.izin}</div>
                          <div style={{ fontSize: '12px', color: '#1d4ed8' }}>Izin</div>
                        </div>
                        <div style={{ background: '#fdfaee', padding: '12px', borderRadius: '8px', border: '1px solid #fef08a', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#854d0e' }}>{details.rekap.sakit}</div>
                          <div style={{ fontSize: '12px', color: '#a16207' }}>Sakit</div>
                        </div>
                        <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#991b1b' }}>{details.rekap.alpa}</div>
                          <div style={{ fontSize: '12px', color: '#b91c1c' }}>Alpa</div>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--clr-gray-200)', textAlign: 'left' }}>
                              <th style={{ padding: '8px', width: '40px' }}>No</th>
                              <th style={{ padding: '8px' }}>Nama Siswa</th>
                              <th style={{ padding: '8px' }}>Status</th>
                              <th style={{ padding: '8px' }}>Setoran / Laporan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.students.map((s: any, i: number) => {
                              const sAtt = details.att.find((a: any) => a.student_id === s.id)
                              const sMems = details.mems.filter((mem: any) => mem.student_id === s.id)
                              
                              let badgeColor = '#fee2e2', textColor = '#dc2626', label = 'Alpa'
                              if (sAtt?.status === 'hadir') { badgeColor = '#dcfce7'; textColor = '#16a34a'; label = 'Hadir' }
                              else if (sAtt?.status === 'izin') { badgeColor = '#dbeafe'; textColor = '#2563eb'; label = 'Izin' }
                              else if (sAtt?.status === 'sakit') { badgeColor = '#fef9c3'; textColor = '#ca8a04'; label = 'Sakit' }

                              return (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--clr-gray-100)' }}>
                                  <td style={{ padding: '8px' }}>{i + 1}</td>
                                  <td style={{ padding: '8px', fontWeight: 500 }}>{s.name}</td>
                                  <td style={{ padding: '8px' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '100px', background: badgeColor, color: textColor, fontSize: '11px', fontWeight: 'bold' }}>
                                      {label}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px', color: 'var(--clr-gray-600)' }}>
                                    {sMems.length > 0 ? (
                                      <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                        {sMems.map((mem: any, memIdx: number) => (
                                          <li key={memIdx}>
                                            {mem.surah_name} ({mem.verse_start}-{mem.verse_end}) - <strong style={{ color: 'var(--clr-primary-700)' }}>{mem.score}</strong>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
