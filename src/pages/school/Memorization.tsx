import { useState, useEffect } from 'react'
import { BookOpen, Users, CheckSquare, Edit, Trash2, Download, Printer } from 'lucide-react'
import { getSync, mutateData } from '@/lib/db'
import { SURAHS } from '@/data/surahs'
import { getJuzFromSurah } from '@/lib/progressEngine'
import toast from 'react-hot-toast'
import styles from './Memorization.module.css'

interface MemorizationPageProps { 
  entityId: string
  entityType?: string
  entityData?: any
}

export default function MemorizationPage({ entityId, entityType = 'sekolah' }: MemorizationPageProps) {
  const [memorizations, setMemorizations] = useState<any[]>([])

  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showMassEdit, setShowMassEdit] = useState(false)
  const [massStatus, setMassStatus] = useState('lancar')
  const [massScore, setMassScore] = useState('85')
  const [massNote, setMassNote] = useState('')

  const loadData = () => {
    const allMem = getSync('tahfidz_memorization_records')
    const allStudents = getSync('tahfidz_students')
    
    const classMem = allMem
      .filter((m: any) => m.class_id === entityId)
      .map((m: any) => {
        const student = allStudents.find((s: any) => s.id === m.student_id)
        const surah = SURAHS.find(s => s.name_latin === m.surah_name)
        return {
          ...m,
          student_name: student?.name || 'Unknown Student',
          juz: surah ? getJuzFromSurah(surah.number) : 30,
          date: m.date || m.created_at
        }
      })
      .reverse() // newest first
      
    setMemorizations(classMem)
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('local_cache_updated', handleUpdate)
    return () => window.removeEventListener('local_cache_updated', handleUpdate)
  }, [entityId, entityType])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    if (status.includes('sangat_lancar') || status === 'lancar') return 'var(--clr-success)'
    if (status.includes('cukup')) return 'var(--clr-info)'
    if (status.includes('murojaah')) return 'var(--clr-warning)'
    return 'var(--clr-danger)'
  }

  const getStatusLabel = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // --- BULK ACTIONS LOGIC ---
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === memorizations.length) setSelectedIds([])
    else setSelectedIds(memorizations.map(r => r.id))
  }

  const handleMassDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.length} data setoran secara permanen?`)) return
    
    for (const id of selectedIds) {
      await mutateData('memorization_records', 'DELETE', { id }, 'tahfidz_memorization_records')
    }
    
    toast.success(`${selectedIds.length} data berhasil dihapus`)
    setSelectedIds([])
  }

  const handleMassEditSubmit = async () => {
    const allMem = getSync('tahfidz_memorization_records')
    for (const m of allMem) {
      if (selectedIds.includes(m.id)) {
        await mutateData('memorization_records', 'UPDATE', {
          id: m.id,
          status: massStatus,
          score: parseInt(massScore),
          note: massNote !== '' ? massNote : m.note
        }, 'tahfidz_memorization_records')
      }
    }
    
    toast.success(`Berhasil mengubah ${selectedIds.length} data setoran`)
    setShowMassEdit(false)
    setSelectedIds([])
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerCard} style={{ background: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-gray-200)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 var(--space-2) 0' }}>
          <BookOpen size={20} /> Riwayat Setoran Hafalan
        </h2>
        <p style={{ color: 'var(--clr-gray-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
          Daftar seluruh riwayat setoran hafalan siswa yang telah diinput melalui menu Pertemuan.
        </p>
      </div>

      {/* Toolbar Bulk Actions */}
      {memorizations.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--clr-gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--clr-gray-200)' }}>
          <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={toggleSelectAll}>
            <CheckSquare size={14} /> {selectedIds.length === memorizations.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </button>
          
          {selectedIds.length > 0 && (
            <>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setShowMassEdit(!showMassEdit)}>
                <Edit size={14} /> Edit Massal
              </button>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }} onClick={handleMassDelete}>
                <Trash2 size={14} /> Ke Sampah
              </button>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => toast.success('Mengekspor data yang dipilih...')}>
                <Download size={14} /> Export
              </button>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => window.print()}>
                <Printer size={14} /> Cetak
              </button>
              <span style={{ fontSize: '12px', color: 'var(--clr-primary-700)', fontWeight: 600, marginLeft: 'auto' }}>
                {selectedIds.length} dipilih
              </span>
            </>
          )}
        </div>
      )}

      {/* Mass Edit Form */}
      {showMassEdit && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '16px', background: 'var(--clr-primary-50)', border: '1px solid var(--clr-primary-200)', borderRadius: '8px' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Ubah Status Hafalan</label>
            <select className="form-select" value={massStatus} onChange={e => setMassStatus(e.target.value)}>
              <option value="sangat_lancar">Sangat Lancar</option>
              <option value="lancar">Lancar</option>
              <option value="cukup">Cukup</option>
              <option value="perlu_murojaah">Perlu Murojaah</option>
              <option value="belum_lancar">Belum Lancar</option>
            </select>
          </div>
          <div className="form-group" style={{ width: '100px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Ubah Nilai</label>
            <input type="number" className="form-input" value={massScore} onChange={e => setMassScore(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Tambah Catatan (Opsional)</label>
            <input type="text" className="form-input" placeholder="Kosongkan jika tidak ingin mengubah catatan" value={massNote} onChange={e => setMassNote(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button className="btn-primary" style={{ height: '38px', padding: '0 16px' }} onClick={handleMassEditSubmit}>Simpan</button>
            <button className="btn-outline" style={{ height: '38px', padding: '0 16px' }} onClick={() => setShowMassEdit(false)}>Batal</button>
          </div>
        </div>
      )}

      {memorizations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--clr-gray-200)' }}>
          <BookOpen size={40} color="var(--clr-gray-300)" style={{ marginBottom: 'var(--space-2)' }} />
          <p style={{ color: 'var(--clr-gray-500)' }}>Belum ada data riwayat setoran.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.desktopTable}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--clr-gray-50)', borderBottom: '1px solid var(--clr-gray-200)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-3)', width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === memorizations.length && memorizations.length > 0} 
                      onChange={toggleSelectAll} 
                      style={{ accentColor: 'var(--clr-primary-600)' }} 
                    />
                  </th>
                  <th style={{ padding: 'var(--space-3)' }}>No</th>
                  <th style={{ padding: 'var(--space-3)' }}>Tanggal</th>
                  <th style={{ padding: 'var(--space-3)' }}>Nama Siswa</th>
                  <th style={{ padding: 'var(--space-3)' }}>Surat</th>
                  <th style={{ padding: 'var(--space-3)' }}>Ayat</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Juz</th>
                  <th style={{ padding: 'var(--space-3)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Nilai</th>
                  <th style={{ padding: 'var(--space-3)' }}>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {memorizations.map((m, idx) => {
                  const isSelected = selectedIds.includes(m.id)
                  return (
                    <tr 
                      key={m.id} 
                      style={{ 
                        borderBottom: '1px solid var(--clr-gray-100)',
                        background: isSelected ? 'var(--clr-primary-50)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(m.id)}
                          style={{ accentColor: 'var(--clr-primary-600)' }} 
                        />
                      </td>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 600, color: 'var(--clr-gray-500)', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--clr-gray-500)' }}>{formatDate(m.date)}</td>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} color="var(--clr-gray-400)" />
                          {m.student_name}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>{m.surah_name}</td>
                      <td style={{ padding: 'var(--space-3)' }}>{m.verse_start} - {m.verse_end}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'bold' }}>{m.juz}</td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '100px', 
                          fontSize: '10px', 
                          fontWeight: 'bold',
                          background: `${getStatusColor(m.status)}20`,
                          color: getStatusColor(m.status)
                        }}>
                          {getStatusLabel(m.status)}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'bold', color: 'var(--clr-primary-600)' }}>
                        {m.score}
                      </td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--clr-gray-500)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.note}>
                        {m.note || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileCards}>
            {memorizations.map(m => {
              const isSelected = selectedIds.includes(m.id)
              return (
                <div key={m.id} className={`${styles.mCard} ${isSelected ? styles.mCardSelected : ''}`} onClick={(e) => {
                  if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return
                  toggleSelect(m.id) // Default action for tapping a card is to select it for now
                }}>
                  <div className={styles.mCardHeader}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(m.id) }}
                      className={styles.mCheckbox}
                    />
                    <div className={styles.mCardTitleWrap}>
                      <div className={styles.mCardDate}>{formatDate(m.date)}</div>
                      <div className={styles.mCardTitle}>{m.student_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={styles.mScore}>{m.score}</span>
                      <div className={styles.mJuz}>Juz {m.juz}</div>
                    </div>
                  </div>
                  <div className={styles.mSurahInfo}>
                    <span className={styles.mSurahName}>{m.surah_name}</span>
                    <span className={styles.mVerse}>Ayat {m.verse_start} - {m.verse_end}</span>
                  </div>
                  
                  <div className={styles.mCardFooter}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '100px', 
                      fontSize: '10px', 
                      fontWeight: 'bold',
                      background: `${getStatusColor(m.status)}20`,
                      color: getStatusColor(m.status)
                    }}>
                      {getStatusLabel(m.status)}
                    </span>
                    {m.note && <span className={styles.mNote}>{m.note}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
