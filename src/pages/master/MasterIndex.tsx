import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Shield, Plus, Edit2, UserX, UserCheck,
  KeyRound, X, Eye, EyeOff, Search, Crown, BookOpen, Trash2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@supabase/supabase-js'
import { getSync, fetchBackground, mutateData } from '@/lib/db'
import toast from 'react-hot-toast'
import styles from './MasterIndex.module.css'

// ── Types ──────────────────────────────────────────────────────────────────
type GRole = 'admin' | 'guru'

interface Teacher {
  id: string
  user_id?: string | null
  name: string
  email: string
  phone: string
  role: GRole
  is_active: boolean
  created_at: string
}

const STORAGE_KEY = 'tahfidz_teachers'

const PASSWORDS_KEY = 'tahfidz_teacher_passwords'

function loadPasswords(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}')
  } catch { return {} }
}

function savePassword(email: string, password: string) {
  const map = loadPasswords()
  map[email.toLowerCase()] = password
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(map))
}

function generateId() {
  return crypto.randomUUID()
}

// ── Default Modal State ────────────────────────────────────────────────────
const emptyForm = { name: '', email: '', phone: '', role: 'guru' as GRole, password: '' }

// ── Component ──────────────────────────────────────────────────────────────
export default function MasterIndex() {
  const { profile, setActiveWorkspaceId } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'guru' | 'hak-akses'>('guru')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'semua' | GRole>('semua')
  const [filterActive, setFilterActive] = useState<'semua' | 'aktif' | 'nonaktif'>('semua')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Teacher | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  // Reset pass modal
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetTarget, setResetTarget] = useState<Teacher | null>(null)
  const [resetPass, setResetPass] = useState('')
  const [showResetPass, setShowResetPass] = useState(false)

  // ── Load ──
  const fetchTeachers = () => {
    const list = getSync(STORAGE_KEY)
    // Inject current admin (demo) jika belum ada
    if (profile && !list.find((t:any) => t.email === profile.email)) {
      const adminEntry: Teacher = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone ?? '',
        role: profile.role,
        is_active: true,
        created_at: new Date().toISOString(),
      }
      const updated = [adminEntry, ...list]
      mutateData('teachers', 'INSERT', adminEntry, STORAGE_KEY)
      setTeachers(updated)
    } else {
      setTeachers(list)
    }

    if (navigator.onLine) {
      fetchBackground('teachers', STORAGE_KEY).catch(console.error)
    }
  }

  useEffect(() => {
    fetchTeachers()
    const handleUpdate = () => fetchTeachers()
    window.addEventListener('local_cache_updated', handleUpdate)
    return () => window.removeEventListener('local_cache_updated', handleUpdate)
  }, [profile])

  // ── Derived ──
  const filtered = teachers.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
    const matchRole = filterRole === 'semua' || t.role === filterRole
    const matchActive =
      filterActive === 'semua' ? true :
      filterActive === 'aktif' ? t.is_active : !t.is_active
    return matchSearch && matchRole && matchActive
  })

  // ── Handlers ──
  const openAdd = () => {
    setEditTarget(null)
    setForm({ ...emptyForm })
    setShowPass(false)
    setShowModal(true)
  }

  const openEdit = (t: Teacher) => {
    setEditTarget(t)
    setForm({ name: t.name, email: t.email, phone: t.phone, role: t.role, password: '' })
    setShowPass(false)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nama dan email wajib diisi.')
      return
    }
    if (!editTarget && !form.password) {
      toast.error('Password wajib diisi untuk guru baru.')
      return
    }
    setSaving(true)

    if (editTarget) {
      const payload = { id: editTarget.id, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), role: form.role }
      const res = await mutateData('teachers', 'UPDATE', payload, STORAGE_KEY)
      if (res && res.success === false) {
        toast.error('Gagal memperbarui data: ' + (res.error?.message || 'DB Error'))
        setSaving(false)
        return
      }
      
      // Migrate password if email changed
      if (editTarget.email.toLowerCase() !== form.email.trim().toLowerCase()) {
        const passwords = loadPasswords()
        if (passwords[editTarget.email.toLowerCase()]) {
          passwords[form.email.trim().toLowerCase()] = passwords[editTarget.email.toLowerCase()]
          delete passwords[editTarget.email.toLowerCase()]
          localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords))
        }
      }
      
      toast.success('Data guru berhasil diperbarui!')
    } else {
      // Check duplicate email
      if (teachers.find(t => t.email.toLowerCase() === form.email.toLowerCase())) {
        toast.error('Email sudah terdaftar.')
        setSaving(false)
        return
      }
      // Create auth user first
      const tempAuthClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
      
      const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      })

      if (authError) {
        toast.error('Gagal membuat akun login: ' + authError.message)
        setSaving(false)
        return
      }

      const newTeacher: Teacher = {
        id: generateId(),
        user_id: authData.user?.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        is_active: true,
        created_at: new Date().toISOString(),
      }
      const res = await mutateData('teachers', 'INSERT', newTeacher, STORAGE_KEY)
      if (res && res.success === false) {
        toast.error('Gagal menyimpan profil: ' + (res.error?.message || 'Pastikan RLS Supabase sudah diatur.'))
        setSaving(false)
        return
      }
      // Save password for demo-mode login (optional fallback)
      if (form.password) savePassword(form.email, form.password)
      toast.success(`Guru "${newTeacher.name}" berhasil ditambahkan dan bisa login!`)
    }

    setSaving(false)
    setShowModal(false)
  }

  const handleToggleActive = async (t: Teacher) => {
    const action = t.is_active ? 'nonaktifkan' : 'aktifkan kembali'
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} akun ${t.name}?`)) return
    const res = await mutateData('teachers', 'UPDATE', { id: t.id, is_active: !t.is_active }, STORAGE_KEY)
    if (res && res.success === false) {
      toast.error('Gagal mengubah status: ' + (res.error?.message || 'DB Error'))
      return
    }
    toast.success(`Akun ${t.name} berhasil di-${action}.`)
  }

  const handleDelete = async (t: Teacher) => {
    if (!window.confirm(`HAPUS PERMANEN akun ${t.name}? Awas, fitur ini akan menghapus data guru sepenuhnya.`)) return
    const res = await mutateData('teachers', 'DELETE', { id: t.id }, STORAGE_KEY)
    if (res && res.success === false) {
      toast.error('Gagal menghapus: ' + (res.error?.message || 'Pastikan RLS admin mengizinkan.'))
      return
    }
    toast.success(`Akun ${t.name} berhasil dihapus permanen.`)
  }

  const openResetPass = (t: Teacher) => {
    setResetTarget(t)
    setResetPass('')
    setShowResetPass(false)
    setShowResetModal(true)
  }

  const handleResetPass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPass || resetPass.length < 6) {
      toast.error('Password minimal 6 karakter.')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    // Save new password for demo-mode login
    if (resetTarget) savePassword(resetTarget.email, resetPass)
    setSaving(false)
    toast.success(`Password ${resetTarget?.name} berhasil direset!`)
    setShowResetModal(false)
  }

  // ── Render ──
  return (
    <div className={`${styles.page} page-enter`}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Master Data</h1>
        <p className={styles.pageSubtitle}>Kelola data guru dan hak akses sistem</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'guru' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('guru')}
        >
          <Users size={16} /> Data Guru
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'hak-akses' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('hak-akses')}
        >
          <Shield size={16} /> Hak Akses
        </button>
      </div>

      {/* ── TAB DATA GURU ── */}
      {activeTab === 'guru' && (
        <div className={styles.content}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cari nama atau email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filters}>
              <select
                className={styles.filterSelect}
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as typeof filterRole)}
              >
                <option value="semua">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="guru">Guru</option>
              </select>
              <select
                className={styles.filterSelect}
                value={filterActive}
                onChange={e => setFilterActive(e.target.value as typeof filterActive)}
              >
                <option value="semua">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
            <button id="btn-tambah-guru" className="btn-primary" onClick={openAdd}>
              <Plus size={16} /> Tambah Guru
            </button>
          </div>

          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statChip}>
              <span className={styles.statNum}>{teachers.length}</span>
              <span className={styles.statLbl}>Total Guru</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statNum}>{teachers.filter(t => t.is_active).length}</span>
              <span className={styles.statLbl}>Aktif</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statNum}>{teachers.filter(t => !t.is_active).length}</span>
              <span className={styles.statLbl}>Nonaktif</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statNum}>{teachers.filter(t => t.role === 'admin').length}</span>
              <span className={styles.statLbl}>Admin</span>
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <Users size={40} opacity={0.3} />
              <p>Belum ada data guru.</p>
              <button className="btn-primary" onClick={openAdd}><Plus size={16}/> Tambah Guru Pertama</button>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>No. HP</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className={!t.is_active ? styles.rowInactive : ''}>
                      <td>
                        <div className={styles.nameCell}>
                          <div className={styles.avatar}>
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className={styles.emailCell}>{t.email}</td>
                      <td>{t.phone || '—'}</td>
                      <td>
                        <span className={`${styles.roleBadge} ${t.role === 'admin' ? styles.roleAdmin : styles.roleGuru}`}>
                          {t.role === 'admin' ? <Crown size={11}/> : <BookOpen size={11}/>}
                          {t.role === 'admin' ? 'Admin' : 'Guru'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${t.is_active ? styles.statusAktif : styles.statusNonaktif}`}>
                          {t.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.actionBtn}
                            title="Edit"
                            onClick={() => openEdit(t)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className={styles.actionBtn}
                            title="Reset Password"
                            onClick={() => openResetPass(t)}
                          >
                            <KeyRound size={15} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${t.is_active ? styles.btnDeactivate : styles.btnActivate}`}
                            title={t.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            onClick={() => handleToggleActive(t)}
                          >
                            {t.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          {t.id !== profile?.id && (
                            <>
                              <button
                                className={styles.actionBtn}
                                title="Hapus Permanen"
                                onClick={() => handleDelete(t)}
                                style={{ color: 'var(--clr-danger)' }}
                              >
                                <Trash2 size={15} />
                              </button>
                              <button
                                className={styles.actionBtn}
                                title="Buka Workspace"
                                onClick={() => {
                                  setActiveWorkspaceId(t.id)
                                  navigate('/dashboard')
                                }}
                                style={{ color: 'var(--brand-600)', background: 'var(--brand-100)' }}
                              >
                                <Eye size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB HAK AKSES ── */}
      {activeTab === 'hak-akses' && (
        <div className={styles.content}>
          <div className={styles.accessGrid}>

            {/* Admin Card */}
            <div className={`${styles.accessCard} ${styles.accessAdmin}`}>
              <div className={styles.accessHeader}>
                <div className={styles.accessIcon}>
                  <Crown size={22} />
                </div>
                <div>
                  <h2 className={styles.accessTitle}>Admin</h2>
                  <span className={styles.accessBadge}>Akses Penuh</span>
                </div>
              </div>
              <ul className={styles.accessList}>
                <li>✅ Melihat seluruh data sistem</li>
                <li>✅ Membuat dan mengelola akun guru</li>
                <li>✅ Menghapus / menonaktifkan akun guru</li>
                <li>✅ Reset password guru</li>
                <li>✅ Backup dan restore database</li>
                <li>✅ Mengelola kelas Sekolah, Les, Privat miliknya</li>
                <li>✅ Input absensi dan setoran hafalan</li>
                <li>✅ Membuat laporan PDF dan Excel</li>
              </ul>
            </div>

            {/* Guru Card */}
            <div className={`${styles.accessCard} ${styles.accessGuru}`}>
              <div className={styles.accessHeader}>
                <div className={styles.accessIcon}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2 className={styles.accessTitle}>Guru Tahfidz</h2>
                  <span className={styles.accessBadge}>Akses Terbatas</span>
                </div>
              </div>
              <ul className={styles.accessList}>
                <li>✅ Melihat data miliknya sendiri</li>
                <li>✅ Mengelola kelas Sekolah miliknya</li>
                <li>✅ Mengelola kelompok Les miliknya</li>
                <li>✅ Mengelola siswa Privat miliknya</li>
                <li>✅ Input absensi dan setoran hafalan</li>
                <li>✅ Membuat laporan PDF dan Excel</li>
                <li>✅ Backup data miliknya sendiri</li>
                <li>❌ Tidak dapat melihat data guru lain</li>
                <li>❌ Tidak dapat mengelola akun guru lain</li>
              </ul>
            </div>

          </div>

          <div className={styles.accessNote}>
            <Shield size={14} />
            Untuk mengubah role guru, buka tab <strong>Data Guru</strong> → klik tombol Edit pada guru yang ingin diubah.
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH / EDIT GURU ── */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editTarget ? <><Edit2 size={18}/> Edit Guru</> : <><Plus size={18}/> Tambah Guru</>}
              </h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form className={styles.modalBody} onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap <span style={{color:'red'}}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama lengkap guru..."
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email / Username <span style={{color:'red'}}>*</span></label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@domain.com"
                  required
                  disabled={!!editTarget}
                  style={editTarget ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
                {editTarget && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-400)' }}>
                    Email tidak dapat diubah
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Nomor HP <span style={{fontSize:'var(--text-xs)', color:'var(--clr-gray-400)'}}>opsional</span></label>
                <input
                  type="tel"
                  className="form-input"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as GRole }))}
                >
                  <option value="guru">Guru Tahfidz</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {!editTarget && (
                <div className="form-group">
                  <label className="form-label">Password <span style={{color:'red'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Minimal 6 karakter..."
                      required={!editTarget}
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
              )}
              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Tambah Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RESET PASSWORD ── */}
      {showResetModal && resetTarget && (
        <div className={styles.overlay} onClick={() => setShowResetModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}><KeyRound size={18}/> Reset Password</h2>
              <button className={styles.modalClose} onClick={() => setShowResetModal(false)}><X size={20}/></button>
            </div>

            <form className={styles.modalBody} onSubmit={handleResetPass}>
              <p className={styles.resetInfo}>
                Reset password untuk: <strong>{resetTarget.name}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    className="form-input"
                    value={resetPass}
                    onChange={e => setResetPass(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowResetPass(v => !v)}>
                    {showResetPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setShowResetModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Memproses...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
