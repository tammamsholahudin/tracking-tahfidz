import { useState } from 'react'
import { BookMarked, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

interface WaliJurnalProps {
  data: any
}

export default function WaliJurnal({ data }: WaliJurnalProps) {
  // We assume meetings have evaluation/journal data. If audit_logs or other tables have it, we use that.
  // Based on schema, 'meetings' has: id, class_id, date, material, evaluation, obstacles, notes, created_at
  const meetings = [...(data?.meetings || [])].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const [expandedId, setExpandedId] = useState<string | null>(meetings[0]?.id || null)

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ width: '64px', height: '64px', background: 'var(--clr-primary-50)', color: 'var(--clr-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <BookMarked size={32} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--clr-gray-900)' }}>Jurnal Pembelajaran</h2>
        <p style={{ color: 'var(--clr-gray-500)', fontSize: '15px', marginTop: '8px', maxWidth: '500px', margin: '8px auto 0' }}>
          Laporan kegiatan belajar mengajar, materi, evaluasi, dan kendala kelas.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {meetings.map((m: any, idx: number) => {
          const isExpanded = expandedId === m.id
          const dateObj = new Date(m.date)
          
          return (
            <div key={m.id} style={{ background: '#fff', borderRadius: '16px', border: isExpanded ? '1px solid var(--clr-primary)' : '1px solid var(--clr-gray-200)', overflow: 'hidden', transition: 'all 0.3s', boxShadow: isExpanded ? '0 10px 30px rgba(0,0,0,0.05)' : 'none' }}>
              
              {/* Header */}
              <div 
                onClick={() => toggleExpand(m.id)}
                style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'var(--clr-primary-50)' : 'transparent' }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: isExpanded ? 'var(--clr-primary)' : 'var(--clr-gray-100)', color: isExpanded ? '#fff' : 'var(--clr-gray-500)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{dateObj.getDate()}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{dateObj.toLocaleDateString('id-ID', { month: 'short' })}</div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: isExpanded ? 'var(--clr-primary-800)' : 'var(--clr-gray-900)' }}>
                      Pertemuan {meetings.length - idx}
                    </h3>
                    <div style={{ fontSize: '13px', color: isExpanded ? 'var(--clr-primary-600)' : 'var(--clr-gray-500)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> {dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div>
                  {isExpanded ? <ChevronUp size={20} color="var(--clr-primary)" /> : <ChevronDown size={20} color="var(--clr-gray-400)" />}
                </div>
              </div>

              {/* Body (Expanded) */}
              {isExpanded && (
                <div style={{ padding: '24px', borderTop: '1px solid var(--clr-primary-100)', background: '#fff' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '8px' }}>Materi Pembelajaran</div>
                      <div style={{ fontSize: '15px', color: 'var(--clr-gray-800)', lineHeight: 1.6, background: 'var(--clr-gray-50)', padding: '16px', borderRadius: '12px' }}>
                        {m.material || <span style={{ fontStyle: 'italic', color: 'var(--clr-gray-400)' }}>Tidak ada data materi.</span>}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '8px' }}>Evaluasi & Perkembangan</div>
                      <div style={{ fontSize: '15px', color: 'var(--clr-gray-800)', lineHeight: 1.6, background: 'var(--clr-gray-50)', padding: '16px', borderRadius: '12px' }}>
                        {m.evaluation || <span style={{ fontStyle: 'italic', color: 'var(--clr-gray-400)' }}>Tidak ada catatan evaluasi.</span>}
                      </div>
                    </div>

                    {(m.obstacles || m.notes) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                        {m.obstacles && (
                          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                            <div style={{ fontSize: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '8px' }}>Kendala</div>
                            <div style={{ fontSize: '14px', color: '#991b1b', lineHeight: 1.5 }}>{m.obstacles}</div>
                          </div>
                        )}
                        {m.notes && (
                          <div style={{ background: '#fefce8', padding: '16px', borderRadius: '12px', border: '1px solid #fef9c3' }}>
                            <div style={{ fontSize: '12px', color: '#eab308', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '8px' }}>Catatan Khusus</div>
                            <div style={{ fontSize: '14px', color: '#854d0e', lineHeight: 1.5 }}>{m.notes}</div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>
          )
        })}

        {meetings.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-gray-500)', background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)' }}>
            Belum ada jurnal pertemuan untuk kelas ini.
          </div>
        )}
      </div>

    </div>
  )
}
