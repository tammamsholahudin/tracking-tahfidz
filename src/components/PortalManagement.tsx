import { useState, useEffect } from 'react'
import { Plus, Link as LinkIcon, Key, Copy, Clock, Power, RefreshCw, ExternalLink } from 'lucide-react'
import { generatePortalLink, fetchPortalLinks, togglePortalLinkStatus } from '@/lib/portal'
import { useAuthStore } from '@/store/authStore'
import { getSync } from '@/lib/db'
import toast from 'react-hot-toast'

export default function PortalManagement() {
  const { profile } = useAuthStore()
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ entityType: 'wali_kelas', entityId: '', duration: '0' })
  
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

  const handleGenerate = async () => {
    if (form.entityType === 'wali_kelas' && !form.entityId) {
      toast.error('Pilih kelas terlebih dahulu!')
      return
    }

    const durationDays = form.duration === '0' ? null : parseInt(form.duration)
    // Jika Kepala Sekolah, set entityId = 'ALL' 
    const eId = form.entityType === 'kepala_sekolah' ? 'ALL' : form.entityId
    
    const res = await generatePortalLink(form.entityType as any, eId, durationDays, profile?.id || 'admin')
    if (res) {
      toast.success('Tautan Portal berhasil dibuat!')
      setShowModal(false)
      loadLinks()
      
      // Auto copy
      const link = `${window.location.origin}/p/${res.linkId}`
      const msg = `*Akses Portal Tracking Tahfidz MAM!*\n\nTautan: ${link}\nSandi: *${res.password}*\n\nSilakan simpan tautan dan sandi ini baik-baik.`
      navigator.clipboard.writeText(msg)
      toast('Tautan & Sandi telah disalin ke clipboard!', { icon: '📋' })
    } else {
      toast.error('Gagal membuat tautan.')
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const success = await togglePortalLinkStatus(id, currentStatus)
    if (success) {
      toast.success(currentStatus ? 'Tautan dinonaktifkan' : 'Tautan diaktifkan')
      loadLinks()
    }
  }

  const getEntityName = (type: string, id: string) => {
    if (type === 'kepala_sekolah') return 'Kepala Sekolah (Semua Akses)'
    const c = classes.find((x: any) => x.id === id)
    return c ? `Wali Kelas - ${c.name}` : 'Kelas Tidak Ditemukan'
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
          onClick={() => setShowModal(true)}
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
                  </div>
                </div>
                
                <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '16px', color: 'var(--clr-gray-800)' }}>
                  {getEntityName(link.entity_type, link.entity_id)}
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
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)' }}><Copy size={14} /></button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={14} />
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--clr-gray-900)' }}>{link.password_hash}</span>
                    <button onClick={() => {
                      navigator.clipboard.writeText(link.password_hash)
                      toast('Sandi disalin!')
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)' }} title="Salin Sandi"><Copy size={14} /></button>
                    <button onClick={() => {
                      toast.success('Sandi baru berhasil dibuat! (Simulasi)')
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }} title="Ganti Password"><RefreshCw size={14} /></button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} />
                      <span>{formatExp(link.expires_at)}</span>
                    </div>
                    <button onClick={() => {
                      window.open(`${window.location.origin}/p/${link.id}`, '_blank')
                    }} style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary)', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ExternalLink size={12} /> Preview
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
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--clr-gray-200)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Buat Akses Portal</h3>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Jenis Portal</label>
                <select 
                  value={form.entityType} 
                  onChange={e => setForm({...form, entityType: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)' }}
                >
                  <option value="wali_kelas">Portal Wali Kelas</option>
                  <option value="kepala_sekolah">Portal Kepala Sekolah</option>
                </select>
              </div>

              {form.entityType === 'wali_kelas' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Target Kelas</label>
                  <select 
                    value={form.entityId} 
                    onChange={e => setForm({...form, entityId: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)' }}
                  >
                    <option value="">Pilih Kelas...</option>
                    {classes.map((c:any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Masa Berlaku</label>
                <select 
                  value={form.duration} 
                  onChange={e => setForm({...form, duration: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)' }}
                >
                  <option value="0">Tidak Kedaluwarsa</option>
                  <option value="30">30 Hari</option>
                  <option value="90">90 Hari</option>
                </select>
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', background: 'var(--clr-gray-50)', borderTop: '1px solid var(--clr-gray-200)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'none', border: 'none', fontWeight: 500, color: 'var(--clr-gray-600)', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleGenerate} style={{ padding: '8px 16px', background: 'var(--clr-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>Generate Tautan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
