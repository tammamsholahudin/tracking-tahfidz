import { useState } from 'react'
import { Search, ShieldCheck, Flame, Book } from 'lucide-react'

interface WaliProgressProps {
  data: any
}

export default function WaliProgress({ data }: WaliProgressProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, juz, points

  const students = data?.students || []
  
  // Calculate mock or real stats per student based on memorizations
  const memorizations = data?.memorizationData || []
  
  const studentStats = students.map((s: any) => {
    const studentMems = memorizations.filter((m: any) => m.student_id === s.id)
    
    // In a real app we'd parse the actual highest juz/surah.
    // For now, we will simulate points based on length of memorizations
    const totalSetoran = studentMems.length
    
    // Highest Juz logic (Mock logic for MVP, or extract if real data exists)
    // Assuming memorization record has `juz` field or similar
    const maxJuz = studentMems.reduce((max: number, m: any) => {
      const j = parseInt(m.juz)
      return j > max ? j : max
    }, 0)
    
    return {
      ...s,
      totalSetoran,
      maxJuz: maxJuz || (totalSetoran > 0 ? 1 : 0), // fallback fake logic if no juz field
      score: totalSetoran * 10
    }
  })

  // Filter & Sort
  const filtered = studentStats.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()))
  
  filtered.sort((a: any, b: any) => {
    if (sortBy === 'juz') return b.maxJuz - a.maxJuz
    if (sortBy === 'points') return b.score - a.score
    return a.name.localeCompare(b.name)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid var(--clr-gray-200)' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>Progress Hafalan Siswa</h2>
          <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginTop: '4px' }}>Pantau perkembangan hafalan per individu</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-gray-400)' }} />
            <input 
              type="text" 
              placeholder="Cari nama siswa..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px 10px 40px', borderRadius: '10px', border: '1px solid var(--clr-gray-200)', fontSize: '14px', outline: 'none' }}
            />
          </div>
          
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--clr-gray-200)', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer' }}
          >
            <option value="name">Urutkan: Nama (A-Z)</option>
            <option value="juz">Urutkan: Juz Tertinggi</option>
            <option value="points">Urutkan: Hafalan Terbanyak</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.map((s: any, idx: number) => {
          // Progress calculation mock (Target = 30 Juz)
          const target = data?.class_info?.target_juz || 30
          const progressPercent = Math.min(100, Math.round((s.maxJuz / target) * 100))
          
          return (
            <div key={s.id} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid var(--clr-gray-200)', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              
              {/* Rank Badge */}
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: idx < 3 ? 'var(--clr-primary-50)' : 'var(--clr-gray-50)', color: idx < 3 ? 'var(--clr-primary)' : 'var(--clr-gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                #{idx + 1}
              </div>

              {/* Student Info */}
              <div style={{ flex: '1 1 200px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>{s.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--clr-gray-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Book size={14} /> NIS: {s.nis || '-'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--clr-gray-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={14} color="#f59e0b" /> {s.totalSetoran} Setoran
                  </span>
                </div>
              </div>

              {/* Progress Bar Area */}
              <div style={{ flex: '2 1 300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ color: 'var(--clr-gray-700)' }}>Juz {s.maxJuz}</span>
                  <span style={{ color: 'var(--clr-primary)' }}>{progressPercent}% dari target</span>
                </div>
                <div style={{ height: '8px', background: 'var(--clr-gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--clr-primary)', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ flexShrink: 0, padding: '6px 12px', background: progressPercent >= 100 ? '#dcfce7' : (progressPercent > 50 ? '#fef3c7' : 'var(--clr-gray-100)'), color: progressPercent >= 100 ? '#166534' : (progressPercent > 50 ? '#92400e' : 'var(--clr-gray-600)'), borderRadius: '100px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {progressPercent >= 100 ? <ShieldCheck size={14} /> : null}
                {progressPercent >= 100 ? 'Tuntas' : (progressPercent > 50 ? 'On Track' : 'Perlu Perhatian')}
              </div>
              
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-gray-500)', background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)' }}>
            Tidak ada data siswa ditemukan.
          </div>
        )}
      </div>
    </div>
  )
}
