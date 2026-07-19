import { useState, useEffect } from 'react'
import { Calendar, Plus, Clock, Trash2, Edit2 } from 'lucide-react'
import { moveToTrash } from '@/lib/trash'
import { checkCollision } from '@/lib/scheduleEngine'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface ScheduleIndexProps { entityId: string; entityType?: string; entityName: string; }

export default function ScheduleIndex({ entityId, entityType = 'sekolah', entityName }: ScheduleIndexProps) {
  const { activeWorkspaceId } = useAuthStore()
  const [schedules, setSchedules] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [day, setDay] = useState('Senin')
  const [startTime, setStartTime] = useState('07:30')
  const [endTime, setEndTime] = useState('08:40')

  useEffect(() => {
    loadSchedules()
  }, [entityId, entityType])

  const loadSchedules = () => {
    const all = JSON.parse(localStorage.getItem('tahfidz_schedules') || '[]')
    setSchedules(all.filter((s: any) => 
      entityType === 'sekolah' ? s.class_id === entityId : s.entity_id === entityId
    ))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation for start and end time is handled by the HTML required attribute

    const all = JSON.parse(localStorage.getItem('tahfidz_schedules') || '[]')
    
    // Check Collision
    const collision = checkCollision({ day, start_time: startTime, end_time: endTime }, all, editingId || undefined)
    if (collision) {
      toast.error(`Gagal: Jadwal bertabrakan dengan "${collision.title}" (${collision.start_time}-${collision.end_time})`)
      return
    }

    let updated = []

    if (editingId) {
      updated = all.map((s: any) => s.id === editingId ? {
        ...s, 
        day, 
        start_time: startTime, 
        end_time: endTime, 
        title: entityType === 'sekolah' ? `Kelas ${entityName}` : entityName,
        entity_type: entityType,
        color: entityType === 'les' ? 'blue' : entityType === 'privat' ? 'purple' : 'green'
      } : s)
      toast.success('Jadwal berhasil diperbarui')
    } else {
      const newSched = {
        id: `sched-${Date.now()}`,
        entity_id: entityId,
        entity_type: entityType,
        class_id: entityType === 'sekolah' ? entityId : null,
        guru_id: activeWorkspaceId,
        title: entityType === 'sekolah' ? `Kelas ${entityName}` : entityName,
        color: entityType === 'les' ? 'blue' : entityType === 'privat' ? 'purple' : 'green',
        day, 
        start_time: startTime, 
        end_time: endTime
      }
      updated = [...all, newSched]
      toast.success('Jadwal baru berhasil ditambahkan')
    }

    localStorage.setItem('tahfidz_schedules', JSON.stringify(updated))
    loadSchedules()
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Hapus jadwal ini? Data akan dipindahkan ke Sampah.')) return
    const sched = schedules.find(s => s.id === id)
    if (sched) {
      moveToTrash('tahfidz_schedules', id, `Jadwal: ${sched.day} (${sched.start_time || sched.startTime}-${sched.end_time || sched.endTime})`)
      loadSchedules()
      toast.success('Jadwal dipindahkan ke Sampah')
    }
  }

  const handleEdit = (sched: any) => {
    setEditingId(sched.id)
    setDay(sched.day)
    setStartTime(sched.start_time || sched.startTime)
    setEndTime(sched.end_time || sched.endTime)
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setDay('Senin')
    setStartTime('07:30')
    setEndTime('08:40')
    setShowForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ background: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 var(--space-1) 0' }}>
            <Calendar size={20} /> Jadwal {entityType === 'sekolah' ? 'Kelas' : entityType === 'les' ? 'Grup Les' : 'Privat'} {entityName}
          </h2>
          <p style={{ color: 'var(--clr-gray-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Atur jadwal tetap untuk kelas ini (Hari, Jam, dan Masa Berlaku).
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Tambah Jadwal
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--clr-gray-50)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-gray-200)' }}>
          <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-md)' }}>
            {editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
          </h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Hari</label>
              <select className="form-select" value={day} onChange={e => setDay(e.target.value)}>
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Jam Mulai</label>
                <input type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Jam Selesai</label>
                <input type="time" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="submit" className="btn-primary">Simpan Jadwal</button>
              <button type="button" className="btn-outline" onClick={resetForm}>Batal</button>
            </div>
          </form>
        </div>
      )}

      {schedules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--clr-gray-200)' }}>
          <Calendar size={40} color="var(--clr-gray-300)" style={{ marginBottom: 'var(--space-2)' }} />
          <p style={{ color: 'var(--clr-gray-500)' }}>Belum ada jadwal tetap untuk kelas ini.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {schedules.map(s => (
            <div key={s.id} style={{ background: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-gray-200)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-lg)', color: 'var(--clr-primary-700)' }}>{s.day}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-sm)', color: 'var(--clr-gray-600)' }}>
                    <Clock size={14} /> {s.start_time || s.startTime} - {s.end_time || s.endTime}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => handleEdit(s)} style={{ background: 'none', border: 'none', color: 'var(--clr-info)', cursor: 'pointer', padding: '4px' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: 'var(--clr-danger)', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-500)', background: 'var(--clr-gray-50)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                <div><strong>Semester:</strong> {s.semester} · {s.academicYear}</div>
                <div><strong>Berlaku:</strong> {s.startDate} s/d {s.endDate}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
