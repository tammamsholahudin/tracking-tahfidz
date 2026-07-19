import { useState, useRef } from 'react'
import { Camera, Mail, Phone, Lock, LogOut, Save, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import styles from './Profile.module.css'

export default function Profile() {
  const { profile, logout, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(profile?.name ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal adalah 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        updateProfile({ photo_url: base64 })
        toast.success('Foto profil berhasil diubah!')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    if (email.trim() !== profile?.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: email.trim() })
      if (authError) {
        toast.error('Gagal mengubah email login: ' + authError.message)
        setSaving(false)
        return
      }
    }

    updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() || null })
    setSaving(false)
    toast.success('Profil berhasil disimpan!')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }



  return (
    <div className={`${styles.page} page-enter`}>
      {/* Profile Header */}
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            {profile?.photo_url
              ? <img src={profile.photo_url} alt={profile.name} />
              : <span>{profile?.name?.charAt(0) ?? 'G'}</span>
            }
          </div>
          <button className={styles.cameraBtn} title="Ganti foto" onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} />
          </button>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handlePhotoChange} 
            style={{ display: 'none' }} 
          />
        </div>
        <h1 className={styles.profileName}>{profile?.name ?? 'Guru'}</h1>
        <div className={styles.roleBadge}>
          {profile?.role === 'admin' ? '👑 Admin' : '📖 Guru Tahfidz'}
        </div>
      </div>

      <div className="content-area">
        {/* Edit Form */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Data Profil</h2>

          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama lengkap..."
            />
          </div>

          <div className="form-group">
            <label className="form-label"><Mail size={14}/> Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label"><Phone size={14}/> No. HP</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="08xx-xxxx-xxxx"
            />
          </div>

          <button id="btn-simpan-profil" className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            <Save size={16}/> {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>

        {/* Change Password */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}><Lock size={16}/> Keamanan</h2>
          <button className={styles.menuRow} onClick={() => toast('Fitur ganti password segera hadir!')}>
            <span>Ganti Password</span>
            <ChevronRight size={16}/>
          </button>
        </div>

        {/* App Info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Tentang Aplikasi</h2>
          <div className={styles.infoRow}><span>Versi</span><strong>1.0.0</strong></div>
          <div className={styles.infoRow}><span>Mode</span><strong>🟢 Cloud Tersinkronisasi</strong></div>
          <div className={styles.infoRow}><span>Aplikasi</span><strong>Tracking Tahfidz MAM!</strong></div>
        </div>

        {/* Logout & Reset */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button id="btn-logout-profil" className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18}/> Keluar dari Akun
          </button>
          
        </div>
      </div>
    </div>
  )
}
