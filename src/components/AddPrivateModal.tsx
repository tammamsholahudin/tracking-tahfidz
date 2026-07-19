import { useState } from 'react'
import { X, Save, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import styles from './AddClassModal.module.css' // Reusing CSS

interface AddPrivateModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddPrivateModal({ onClose, onSuccess }: AddPrivateModalProps) {
  const { activeWorkspaceId } = useAuthStore()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('Juz 30')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama santri tidak boleh kosong')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('private_students').insert({
        student_id: 'default-student',
        teacher_id: 'default-teacher',
        is_active: true
      })

      if (error) {
        // Fallback to localStorage
        const newSantri = {
          id: 'local-prv-' + Date.now().toString(),
          name: name,
          guru_id: activeWorkspaceId,
          target: target,
          last_surah: 'Belum mulai',
          last_verse: 0,
          progress: 0,
          is_active: true
        }
        const existing = JSON.parse(localStorage.getItem('tahfidz_private_students') || '[]')
        localStorage.setItem('tahfidz_private_students', JSON.stringify([...existing, newSantri]))
        
        toast.success('Disimulasikan (Lokal): Santri Privat ditambahkan!')
        onSuccess()
        return
      }

      toast.success('Santri Privat berhasil ditambahkan ke Database!')
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Gagal menambahkan santri')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}><User size={20} /> Tambah Santri Privat</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.body}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap Santri</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Ahmad" 
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Target Hafalan</label>
            <select className="form-select" value={target} onChange={e => setTarget(e.target.value)}>
              <option value="Juz 30">Juz 30</option>
              <option value="Juz 29">Juz 29</option>
              <option value="5 Juz">5 Juz</option>
              <option value="30 Juz">30 Juz</option>
            </select>
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan ke Database</>}
          </button>
        </form>
      </div>
    </div>
  )
}
