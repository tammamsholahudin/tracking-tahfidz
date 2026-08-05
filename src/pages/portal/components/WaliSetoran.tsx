import { useState } from 'react'
import { Filter, Calendar as CalendarIcon, Clock } from 'lucide-react'

interface WaliSetoranProps {
  data: any
}

export default function WaliSetoran({ data }: WaliSetoranProps) {
  const memorizations = data?.memorizationData || []
  const students = data?.students || []
  
  const [filterDate, setFilterDate] = useState('')
  const [filterStudent, setFilterStudent] = useState('')

  // Sort by newest first
  const sorted = [...memorizations].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Apply filters
  const filtered = sorted.filter((m: any) => {
    let match = true
    if (filterDate && !m.date.startsWith(filterDate)) match = false
    if (filterStudent && m.student_id !== filterStudent) match = false
    return match
  })

  const getStudentName = (id: string) => {
    const st = students.find((s: any) => s.id === id)
    return st ? st.name : 'Unknown'
  }

  const getPredicateColor = (p: string) => {
    if (!p) return '#9ca3af' // gray
    const pUpper = p.toUpperCase()
    if (pUpper === 'A') return '#10b981' // green
    if (pUpper === 'B') return '#3b82f6' // blue
    if (pUpper === 'C') return '#f59e0b' // yellow
    if (pUpper === 'D') return '#ef4444' // red
    return '#6b7280'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Filter */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>Timeline Setoran</h2>
          <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginTop: '4px' }}>Riwayat lengkap setoran hafalan seluruh siswa</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--clr-gray-50)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--clr-gray-200)' }}>
            <CalendarIcon size={16} color="var(--clr-gray-500)" />
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: 'var(--clr-gray-700)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--clr-gray-50)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--clr-gray-200)' }}>
            <Filter size={16} color="var(--clr-gray-500)" />
            <select 
              value={filterStudent}
              onChange={e => setFilterStudent(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: 'var(--clr-gray-700)', cursor: 'pointer', minWidth: '150px' }}
            >
              <option value="">Semua Siswa</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        {/* Vertical Line */}
        <div style={{ position: 'absolute', left: '26px', top: '24px', bottom: '24px', width: '2px', background: 'var(--clr-gray-200)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((m: any) => {
            const dateObj = new Date(m.date)
            return (
              <div key={m.id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                
                {/* Timeline Dot */}
                <div style={{ width: '14px', height: '14px', background: 'var(--clr-primary)', borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 0 0 1px var(--clr-gray-200)', marginTop: '24px' }} />

                {/* Card */}
                <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid var(--clr-gray-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'transform 0.2s', cursor: 'default' }}
                     onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                     onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>{getStudentName(m.student_id)}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', color: 'var(--clr-gray-500)', fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> 
                          {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {m.type && (
                          <span style={{ padding: '2px 8px', background: 'var(--clr-gray-100)', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                            {m.type.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: getPredicateColor(m.predicate), lineHeight: 1 }}>
                        {m.predicate || '-'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--clr-gray-400)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: 600 }}>
                        Predikat
                      </div>
                    </div>

                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--clr-gray-200)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginBottom: '4px' }}>Juz</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-gray-800)' }}>{m.juz || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginBottom: '4px' }}>Surah & Ayat</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-gray-800)' }}>{m.surah || '-'} (Ayat {m.ayat || '-'})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginBottom: '4px' }}>Catatan Guru</div>
                      <div style={{ fontSize: '13px', color: 'var(--clr-gray-700)', fontStyle: 'italic' }}>{m.notes || 'Tidak ada catatan.'}</div>
                    </div>
                  </div>

                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-gray-500)', background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', marginLeft: '14px' }}>
              Tidak ada riwayat setoran pada filter ini.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
