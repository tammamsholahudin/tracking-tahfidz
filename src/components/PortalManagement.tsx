import { useState, useEffect } from 'react'
import { Plus, Link as LinkIcon, Key, Copy, Clock, Power, RefreshCw, ExternalLink, QrCode, Trash2, Users as UsersIcon, FileText } from 'lucide-react'
import { generatePortalLink, fetchPortalLinks, togglePortalLinkStatus, updatePortalPassword, deletePortalLink } from '@/lib/portal'
import { useAuthStore } from '@/store/authStore'
import { getSync } from '@/lib/db'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

export default function PortalManagement() {
  const { profile } = useAuthStore()
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showQr, setShowQr] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    entityType: 'wali_kelas',
    portalName: '',
    targetClasses: [] as string[],
    allClasses: true, // For kepala sekolah
    password: '',
    duration: '0', // 0, 1, 7, 30, 90, custom
    customDays: '',
    notes: ''
  })
  
  const classes = getSync('tahfidz_classes') || []

  const loadLinks = async () => {
    setLoading(true)
    const data = await fetchPortalLinks()
    setLinks(data)
    setLoading(false)
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let pwd = ''
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm({ ...form, password: pwd })
  }

  const handleGenerate = async () => {
    if (!form.portalName.trim()) return toast.error('Nama Portal wajib diisi!')
    
    let target = form.targetClasses
    if (form.entityType === 'kepala_sekolah' && form.allClasses) {
      target = ['ALL']
    } else if (target.length === 0) {
      return toast.error('Pilih minimal satu kelas!')
    }

    let dur: number | null = null
    if (form.duration === 'custom') {
      if (!form.customDays || parseInt(form.customDays) <= 0) return toast.error('Masukkan jumlah hari valid!')
      dur = parseInt(form.customDays)
    } else if (form.duration !== '0') {
      dur = parseInt(form.duration)
    }
    
    const res = await generatePortalLink(
      form.entityType as any,
      form.portalName,
      target,
      dur,
      form.password || null, // if empty, backend will generate
      form.notes,
      profile?.id || 'admin'
    )

    if (res) {
      toast.success('Tautan Portal berhasil dibuat!')
      setShowModal(false)
      loadLinks()
      
      const link = `${window.location.origin}/p/${res.linkId}`
      const msg = `*Akses Portal Tracking Tahfidz MAM!*\n\n${form.portalName}\n\nTautan: ${link}\nSandi: *${res.password}*\n\nSilakan simpan tautan dan sandi ini baik-baik.`
      navigator.clipboard.writeText(msg)
      toast('Tautan & Sandi telah disalin ke clipboard!', { icon: '📋' })
    } else {
      toast.error('Gagal membuat tautan. Pastikan database portal_links sudah ada.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus portal ini? Pengguna tidak akan bisa mengakses link ini lagi.')) {
      const ok = await deletePortalLink(id)
      if (ok) {
        toast.success('Portal dihapus!')
        loadLinks()
      }
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const success = await togglePortalLinkStatus(id, currentStatus)
    if (success) {
      toast.success(currentStatus ? 'Tautan dinonaktifkan' : 'Tautan diaktifkan')
      loadLinks()
    }
  }

  const formatExp = (dateStr: string | null) => {
    if (!dateStr) return 'Tidak Kedaluwarsa'
    const d = new Date(dateStr)
    const now = new Date()
    if (d < now) return 'Telah Kedaluwarsa'
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--clr-gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, paddingRight: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--clr-gray-900)' }}>Manajemen Akses Portal</h2>
          <p style={{ fontSize: '14px', color: 'var(--clr-gray-500)', marginTop: '4px' }}>
            Buat tautan aman untuk memberikan akses Read-Only kepada Wali Kelas & Kepala Sekolah tanpa perlu login akun.
          </p>
        </div>
        <button 
          onClick={() => {
            setForm({ entityType: 'wali_kelas', portalName: '', targetClasses: [], allClasses: true, password: '', duration: '0', customDays: '', notes: '' })
            setShowModal(true)
          }}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
        >
          <Plus size={18} />
          Buat Tautan
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--clr-gray-500)' }}>Memuat tautan...</div>
        ) : links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--clr-gray-50)', borderRadius: '12px', border: '1px dashed var(--clr-gray-300)' }}>
            <LinkIcon size={40} style={{ color: 'var(--clr-gray-400)', margin: '0 auto 16px' }} />
            <h3 style={{ fontWeight: 500, color: 'var(--clr-gray-700)', marginBottom: '8px' }}>Belum ada Tautan Portal</h3>
            <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>Buat tautan pertama Anda untuk memberikan akses portal.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {links.map(link => (
              <div key={link.id} style={{ 
                border: `1px solid ${link.is_active ? 'var(--clr-primary-light)' : 'var(--clr-gray-200)'}`, 
                borderRadius: '12px', padding: '16px', 
                background: link.is_active ? '#f0f9ff' : '#f9fafb',
                opacity: link.is_active ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: link.is_active ? 'var(--clr-primary)' : 'var(--clr-gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {link.entity_type === 'kepala_sekolah' ? 'Kepala Sekolah' : 'Wali Kelas'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleToggle(link.id, link.is_active)} title={link.is_active ? 'Nonaktifkan' : 'Aktifkan'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: link.is_active ? '#ef4444' : '#10b981' }}>
                      <Power size={16} />
                    </button>
                    <button onClick={() => handleDelete(link.id)} title="Hapus Portal" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--clr-gray-800)' }}>
                  {link.portal_name}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--clr-gray-600)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkIcon size={14} />
                    <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--clr-gray-200)' }}>
                      /p/{link.id}
                    </code>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/p/${link.id}`)
                      toast('Link disalin!')
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)' }} title="Salin URL"><Copy size={14} /></button>
                    <button onClick={() => setShowQr(showQr === link.id ? null : link.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)' }} title="QR Code"><QrCode size={14} /></button>
                  </div>

                  {showQr === link.id && (
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--clr-gray-200)', textAlign: 'center' }}>
                      <QRCodeSVG value={`${window.location.origin}/p/${link.id}`} size={150} />
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--clr-gray-500)' }}>Scan untuk buka portal</div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={14} />
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--clr-gray-900)' }}>{link.password_hash}</span>
                    <button onClick={() => {
                      navigator.clipboard.writeText(link.password_hash)
                      toast('Sandi disalin!')
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)' }} title="Salin Sandi"><Copy size={14} /></button>
                    <button onClick={async () => {
                      const newPwd = prompt('Masukkan password baru untuk portal ini:')
                      if (newPwd) {
                        const ok = await updatePortalPassword(link.id, newPwd)
                        if (ok) {
                          toast.success('Sandi portal berhasil diubah!')
                          loadLinks()
                        }
                      }
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }} title="Ganti Password"><RefreshCw size={14} /></button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UsersIcon size={14} />
                    <span>Target: {link.target_classes.includes('ALL') ? 'Semua Kelas' : `${link.target_classes.length} Kelas`}</span>
                  </div>

                  {link.notes && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <FileText size={14} style={{ marginTop: '3px' }} />
                      <span style={{ fontStyle: 'italic', color: 'var(--clr-gray-500)' }}>"{link.notes}"</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--clr-gray-200)', paddingTop: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} />
                      <span>{formatExp(link.expires_at)}</span>
                    </div>
                    <button onClick={() => {
                      window.open(`${window.location.origin}/p/${link.id}`, '_blank')
                    }} style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary)', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ExternalLink size={12} /> Buka
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--clr-gray-200)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Buat Akses Portal Baru</h3>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nama Portal <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text"
                  placeholder="Cth: Portal Wali Kelas 3 Bilal"
                  value={form.portalName}
                  onChange={e => setForm({...form, portalName: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Jenis Portal</label>
                <select 
                  value={form.entityType} 
                  onChange={e => setForm({...form, entityType: e.target.value, targetClasses: []})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)' }}
                >
                  <option value="wali_kelas">Portal Wali Kelas</option>
                  <option value="kepala_sekolah">Portal Kepala Sekolah</option>
                </select>
              </div>

              {form.entityType === 'kepala_sekolah' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="allCls" checked={form.allClasses} onChange={e => setForm({...form, allClasses: e.target.checked})} />
                  <label htmlFor="allCls" style={{ fontSize: '14px', cursor: 'pointer' }}>Beri akses ke Semua Kelas</label>
                </div>
              )}

              {(!form.allClasses || form.entityType === 'wali_kelas') && (
                <div style={{ background: 'var(--clr-gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--clr-gray-200)', maxHeight: '150px', overflowY: 'auto' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Pilih Kelas <span style={{color: 'red'}}>*</span></label>
                  {classes.map((c:any) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input 
                        type={form.entityType === 'wali_kelas' ? 'radio' : 'checkbox'} 
                        name="clsTarget"
                        checked={form.targetClasses.includes(c.id)}
                        onChange={(e) => {
                          if (form.entityType === 'wali_kelas') {
                            setForm({...form, targetClasses: [c.id]})
                          } else {
                            if (e.target.checked) setForm({...form, targetClasses: [...form.targetClasses, c.id]})
                            else setForm({...form, targetClasses: form.targetClasses.filter(id => id !== c.id)})
                          }
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Password (Opsional)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text"
                    placeholder="Bisa dikosongkan (Otomatis dibuat)"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)' }}
                  />
                  <button type="button" onClick={generateRandomPassword} style={{ background: 'var(--clr-gray-100)', border: '1px solid var(--clr-gray-300)', padding: '0 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Masa Berlaku</label>
                <select 
                  value={form.duration} 
                  onChange={e => setForm({...form, duration: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)' }}
                >
                  <option value="0">Tidak Kedaluwarsa</option>
                  <option value="1">1 Hari</option>
                  <option value="7">7 Hari</option>
                  <option value="30">30 Hari</option>
                  <option value="90">90 Hari</option>
                  <option value="custom">Custom (Pilih jumlah hari)</option>
                </select>
                {form.duration === 'custom' && (
                  <input 
                    type="number"
                    min="1"
                    placeholder="Jumlah hari..."
                    value={form.customDays}
                    onChange={e => setForm({...form, customDays: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)', marginTop: '8px' }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Catatan Portal (Opsional)</label>
                <textarea 
                  placeholder="Misal: Portal khusus semester ganjil."
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)', resize: 'none', height: '60px' }}
                />
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', background: 'var(--clr-gray-50)', borderTop: '1px solid var(--clr-gray-200)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'none', border: 'none', fontWeight: 500, color: 'var(--clr-gray-600)', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleGenerate} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>Generate Tautan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
