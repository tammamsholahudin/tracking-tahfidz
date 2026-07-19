import { useState } from 'react'
import { X, Save, User } from 'lucide-react'
import { mutateData } from '@/lib/db'
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
      const newSantri = {
        id: `local-prv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        guru_id: activeWorkspaceId,
        target: target,
        last_surah: 'Belum mulai',
        last_verse: 0,
        progress: 0,
        is_active: true
      }
      
      await mutateData('private_students', 'INSERT', newSantri, 'tahfidz_private_students')
      toast.success('Santri Privat berhasil ditambahkan!')
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
          <button type="submit" className={styles.btnPrimary} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Santri Privat</>}
          </button>
        </form>
      </div>
    </div>
  )
}
