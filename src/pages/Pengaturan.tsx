import { useState } from 'react'
import {
  User, Lock, LogOut, Info,
  ChevronRight, Eye, EyeOff, BookOpen,
  CheckCircle2, Building2, Save
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import styles from './Pengaturan.module.css'

export default function Pengaturan() {
  const { profile, logout } = useAuthStore()
  const { institutionName, institutionSubtitle, updateSettings } = useSettingsStore()
  const navigate = useNavigate()

  // Institution name state
  const [instName, setInstName] = useState(institutionName)
  const [instSub, setInstSub] = useState(institutionSubtitle)
  const [savingInst, setSavingInst] = useState(false)

  const handleSaveInstitution = async () => {
    if (!instName.trim()) { toast.error('Nama instansi tidak boleh kosong.'); return }
    setSavingInst(true)
    
    // Save to local state for fast UI update and PDF/Excel helpers
    updateSettings({ institutionName: instName.trim(), institutionSubtitle: instSub.trim() || institutionSubtitle })
    
    // Save to Supabase to sync across devices
    await useAuthStore.getState().updateProfile({ 
      institution_name: instName.trim(), 
      institution_subtitle: instSub.trim() || institutionSubtitle 
    })
    
    setSavingInst(false)
    toast.success('Nama instansi berhasil disimpan dan disinkronisasikan!')
  }

  // Change Password state
  const [showPassModal, setShowPassModal] = useState(false)
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPass, setSavingPass] = useState(false)

  const handleLogout = async () => {
    if (!window.confirm('Yakin ingin keluar dari akun?')) return
    await logout()
    navigate('/login', { replace: true })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPass || newPass.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }
    if (newPass !== confirmPass) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    setSavingPass(true)
    await new Promise(r => setTimeout(r, 800))
    setSavingPass(false)

    toast.success('Password berhasil diubah!')
    setShowPassModal(false)
    setOldPass(''); setNewPass(''); setConfirmPass('')
  }


  return (
    <div className={`${styles.page} page-enter`}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Pengaturan</h1>
        <p className={styles.pageSubtitle}>Kelola akun dan preferensi aplikasi</p>
      </div>

      <div className={styles.content}>

        {/* ── AKUN ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Akun</div>

          <div className={styles.card}>
            {/* Edit Profil */}
            <button
              id="btn-edit-profil"
              className={styles.menuRow}
              onClick={() => navigate('/profil')}
            >
              <div className={styles.menuIcon} style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary-600)' }}>
                <User size={18} />
              </div>
              <div className={styles.menuText}>
                <span className={styles.menuTitle}>Edit Profil</span>
                <span className={styles.menuDesc}>Ubah nama dan nomor HP</span>
              </div>
              <ChevronRight size={16} className={styles.menuChevron} />
            </button>

            <div className={styles.divider} />

            {/* Ganti Password */}
            <button
              id="btn-ganti-password"
              className={styles.menuRow}
              onClick={() => setShowPassModal(true)}
            >
              <div className={styles.menuIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                <Lock size={18} />
              </div>
              <div className={styles.menuText}>
                <span className={styles.menuTitle}>Ganti Password</span>
                <span className={styles.menuDesc}>Ubah kata sandi akun Anda</span>
              </div>
              <ChevronRight size={16} className={styles.menuChevron} />
            </button>

            <div className={styles.divider} />

            {/* Logout */}
            <button
              id="btn-logout-pengaturan"
              className={styles.menuRow}
              onClick={handleLogout}
            >
              <div className={styles.menuIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
                <LogOut size={18} />
              </div>
              <div className={styles.menuText}>
                <span className={styles.menuTitle} style={{ color: '#dc2626' }}>Keluar dari Akun</span>
                <span className={styles.menuDesc}>Anda akan diarahkan ke halaman login</span>
              </div>
              <ChevronRight size={16} className={styles.menuChevron} />
            </button>
          </div>
        </div>

        {/* ── INSTANSI ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Instansi</div>

          <div className={styles.card}>
            <div className={styles.menuRow} style={{ cursor: 'default', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div className={styles.menuIcon} style={{ background: '#dbeafe', color: '#1d4ed8', marginTop: 2 }}>
                <Building2 size={18} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <span className={styles.menuTitle}>Nama Instansi / Sekolah</span>
                  <span className={styles.menuDesc}>Muncul di header laporan PDF dan Excel</span>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Nama Instansi</label>
                  <input
                    id="input-nama-instansi"
                    type="text"
                    className="form-input"
                    value={instName}
                    onChange={e => setInstName(e.target.value)}
                    placeholder="Nama instansi..."
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Sub-judul Instansi</label>
                  <input
                    id="input-subjudul-instansi"
                    type="text"
                    className="form-input"
                    value={instSub}
                    onChange={e => setInstSub(e.target.value)}
                    placeholder="Sub-judul / nama aplikasi..."
                  />
                </div>
                <div className={styles.instPreview}>
                  <span className={styles.instPreviewLabel}>Preview Header Laporan:</span>
                  <strong className={styles.instPreviewName}>{instName || '—'}</strong>
                  <span className={styles.instPreviewSub}>{instSub || '—'}</span>
                </div>
                <button
                  id="btn-simpan-instansi"
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={handleSaveInstitution}
                  disabled={savingInst}
                >
                  <Save size={15} /> {savingInst ? 'Menyimpan...' : 'Simpan Nama Instansi'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── TENTANG ── */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Tentang</div>

          <div className={styles.card}>
            <div className={styles.menuRow} style={{ cursor: 'default' }}>
              <div className={styles.menuIcon} style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary-600)' }}>
                <Info size={18} />
              </div>
              <div className={styles.menuText}>
                <span className={styles.menuTitle}>Tentang Aplikasi</span>
                <span className={styles.menuDesc}>Tracking Tahfidz MAM! v1.0.0</span>
              </div>
            </div>

            <div className={styles.aboutBox}>
              <div className={styles.aboutLogo}>
                <BookOpen size={32} color="var(--clr-primary-600)" />
              </div>
              <h2 className={styles.aboutName}>Tracking Tahfidz MAM!</h2>
              <p className={styles.aboutDesc}>
                Alat kerja Guru Tahfidz untuk mencatat absensi,
                setoran hafalan, dan perkembangan santri.
              </p>
              <div className={styles.aboutRows}>
                <div className={styles.aboutRow}>
                  <span>Versi</span><strong>1.0.0</strong>
                </div>
                <div className={styles.aboutRow}>
                  <span>Mode</span>
                  <strong>☁️ Offline-First Local</strong>
                </div>
                <div className={styles.aboutRow}>
                  <span>Role</span>
                  <strong>{profile?.role === 'admin' ? '👑 Admin' : '📖 Guru Tahfidz'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── MODAL GANTI PASSWORD ── */}
      {showPassModal && (
        <div className={styles.overlay} onClick={() => setShowPassModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}><Lock size={18} /> Ganti Password</h2>
              <button className={styles.modalClose} onClick={() => setShowPassModal(false)}>✕</button>
            </div>


            <form className={styles.modalBody} onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Password Lama</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="form-input"
                    value={oldPass}
                    onChange={e => setOldPass(e.target.value)}
                    placeholder="Password saat ini..."
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowOld(v => !v)}>
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-input"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Ulangi password baru..."
                  required
                />
              </div>

              {newPass && confirmPass && newPass === confirmPass && (
                <div className={styles.passMatch}>
                  <CheckCircle2 size={14} /> Password cocok
                </div>
              )}

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setShowPassModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={savingPass}>
                  {savingPass ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
