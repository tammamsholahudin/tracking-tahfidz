import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Lock, Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { downloadMassZip } from '@/lib/exportAll'

export default function PublicPortal() {
  const { linkId } = useParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  
  // Login state
  const [isLogged, setIsLogged] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    
    try {
      // First verify access
      const { data: vData, error: vError } = await supabase.rpc('verify_portal_access', { p_link_id: linkId, p_password: password })
      
      if (vError) throw vError
      
      if (!vData.valid) {
        toast.error(vData.error || 'Akses ditolak')
        setLoading(false)
        return
      }
      
      // If valid, fetch data based on type
      if (vData.entity_type === 'wali_kelas') {
        const { data: cData, error: cError } = await supabase.rpc('get_portal_class_data', { p_link_id: linkId, p_password: password, p_class_id: vData.entity_id })
        if (cError) throw cError
        
        if (!cData.valid) throw new Error(cData.error)
        setData({ type: 'wali_kelas', ...cData })
      } else {
        const { data: sData, error: sError } = await supabase.rpc('get_portal_school_data', { p_link_id: linkId, p_password: password })
        if (sError) throw sError
        
        if (!sData.valid) throw new Error(sData.error)
        setData({ type: 'kepala_sekolah', ...sData })
      }
      
      setIsLogged(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal mengambil data')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAll = async () => {
    if (data?.type === 'wali_kelas') {
      try {
        toast.loading('Menyiapkan file ZIP...', { id: 'zip' })
        await downloadMassZip({
          classData: data.class_info,
          students: data.students || [],
          meetings: data.meetings || [],
          attendanceData: data.attendance || [],
          memorizationData: data.memorization || []
        })
        toast.success('Unduhan selesai!', { id: 'zip' })
      } catch (err) {
        console.error(err)
        toast.error('Gagal mengunduh ZIP', { id: 'zip' })
      }
    } else {
      toast.error('Unduh massal Kepala Sekolah belum diimplementasi') // MVP
    }
  }

  if (!isLogged) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-gray-50)', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--clr-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--clr-primary)' }}>
              <Lock size={32} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>Akses Portal</h1>
            <p style={{ color: 'var(--clr-gray-500)', marginTop: '8px' }}>Masukkan kata sandi untuk melihat data.</p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="password" 
              placeholder="Kata Sandi" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--clr-gray-300)', fontSize: '16px', width: '100%' }}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '12px', background: 'var(--clr-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Buka Portal'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Dashboard Wali Kelas
  if (data?.type === 'wali_kelas') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--clr-gray-50)' }}>
        <header style={{ background: 'var(--clr-primary)', color: '#fff', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Portal Wali Kelas</h1>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>{data.class_info?.name} - {data.class_info?.academic_year}</p>
          </div>
          <button onClick={handleDownloadAll} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', display: 'flex', gap: '8px', cursor: 'pointer', alignItems: 'center' }}>
            <Download size={18} />
            Unduh Semua (ZIP)
          </button>
        </header>
        
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Stat Cards */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)' }}>
              <div style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginBottom: '8px' }}>Total Siswa</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>{data.students?.length || 0}</div>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)' }}>
              <div style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginBottom: '8px' }}>Total Pertemuan</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>{data.meetings?.length || 0}</div>
            </div>
          </div>
          
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Daftar Siswa</h2>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', overflow: 'hidden' }}>
            {data.students?.map((s:any, i:number) => (
              <div key={s.id} style={{ padding: '16px', borderBottom: i < data.students.length - 1 ? '1px solid var(--clr-gray-100)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{s.name}</span>
                <span style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>NIS: {s.nis || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Dashboard Kepala Sekolah
  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-gray-50)' }}>
      <header style={{ background: 'var(--clr-primary)', color: '#fff', padding: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Portal Kepala Sekolah</h1>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>Akses Pemantauan Seluruh Kelas</p>
      </header>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Daftar Kelas Aktif</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {data?.classes?.map((c:any) => (
            <div key={c.id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{c.name}</h3>
              <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>Wali Kelas: {c.homeroom_teacher || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
