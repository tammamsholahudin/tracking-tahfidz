import { useState } from 'react'
import { X, Save, Calendar, AlertTriangle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './AddClassModal.module.css' // Reusing CSS
import { checkCollision } from '@/lib/scheduleEngine'

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
}

interface SetJadwalModalProps {
  entityType: 'sekolah' | 'les' | 'privat' | 'manual'
  entityId?: string
  entityName?: string
  onClose: () => void
  onSuccess: () => void
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function SetJadwalModal({ entityType, entityId, entityName, onClose, onSuccess }: SetJadwalModalProps) {
  const [day, setDay] = useState('Senin')
  const [startTime, setStartTime] = useState('07:30')
  const [endTime, setEndTime] = useState('08:40')
  const [location, setLocation] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [syncGoogle, setSyncGoogle] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent, force: boolean = false) => {
    e.preventDefault()
    
    if (!force) {
      const existing = JSON.parse(localStorage.getItem('tahfidz_schedules') || '[]') as Schedule[]
      const collision = checkCollision({ day, start_time: startTime, end_time: endTime }, existing)
      if (collision) {
        setConflictMsg(`Jadwal bertabrakan dengan ${collision.title} (${collision.start_time}-${collision.end_time})`)
        return
      }
    }

    setLoading(true)
    try {
      const colorMap = { sekolah: 'green', les: 'blue', privat: 'purple', manual: 'gray' }
      const finalTitle = entityType === 'manual' ? manualTitle : entityName
      const newSchedule: Schedule = {
        id: `sched-${Date.now()}`,
        entity_type: entityType,
        entity_id: entityId || 'manual',
        title: finalTitle || 'Jadwal Manual',
        day,
        start_time: startTime,
        end_time: endTime,
        location,
        color: colorMap[entityType]
      }

      const existing = JSON.parse(localStorage.getItem('tahfidz_schedules') || '[]')
      localStorage.setItem('tahfidz_schedules', JSON.stringify([...existing, newSchedule]))

      toast.success(syncGoogle ? 'Jadwal ditambahkan & disinkronkan ke Google Calendar!' : 'Jadwal berhasil ditambahkan!')
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyimpan jadwal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}><Calendar size={20} /> Atur Jadwal</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        {conflictMsg ? (
          <div style={{ padding: 'var(--space-4)', background: 'var(--clr-warning-bg)', margin: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', color: 'var(--clr-warning)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
              <AlertTriangle size={18} /> Peringatan Bentrok
            </div>
            <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{conflictMsg}</p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button 
                className={styles.btnPrimary} 
                style={{ flex: 1, background: 'var(--clr-warning)', boxShadow: 'none' }} 
                onClick={(e) => handleSubmit(e as any, true)}
              >
                Tetap Simpan
              </button>
              <button 
                className={styles.btnPrimary} 
                style={{ flex: 1, background: 'var(--clr-gray-200)', color: 'var(--clr-gray-800)', boxShadow: 'none' }} 
                onClick={() => setConflictMsg(null)}
              >
                Ubah Jadwal
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.body}>
            {entityType !== 'manual' ? (
              <div style={{ background: 'var(--clr-gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>
                Subjek: {entityName}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Nama Kegiatan / Agenda</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: Rapat Wali Murid" 
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Hari</label>
              <select className="form-select" value={day} onChange={e => setDay(e.target.value)}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label"><Clock size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> Mulai</label>
                <input type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label"><Clock size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> Selesai</label>
                <input type="time" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lokasi (Opsional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: Ruang 3 / Masjid" 
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            
            <div style={{ padding: 'var(--space-3)', background: 'var(--clr-gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input 
                type="checkbox" 
                id="sync_google"
                checked={syncGoogle}
                onChange={e => setSyncGoogle(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="sync_google" style={{ fontSize: 'var(--text-sm)', cursor: 'pointer', margin: 0 }}>
                Sinkronkan ke Google Calendar (Simulasi)
              </label>
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading} style={{ marginTop: 'var(--space-2)' }}>
              {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Jadwal</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
