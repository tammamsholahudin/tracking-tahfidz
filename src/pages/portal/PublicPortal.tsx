import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { validatePortalAccess } from '@/lib/portal'
import { Lock, Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { downloadMassZip } from '@/lib/exportAll'

export default function PublicPortal() {
  const { linkId } = useParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [portalMeta, setPortalMeta] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [isLogged, setIsLogged] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !linkId) return
    setLoading(true)
    
    try {
      // Verify access
      const res = await validatePortalAccess(linkId, password)
      
      if (!res.success) {
        toast.error(res.error || 'Akses ditolak')
        setLoading(false)
        return
      }
      
      setPortalMeta(res.data)
      const targetClasses = res.data.target_classes

      if (res.data.entity_type === 'wali_kelas') {
        const classId = targetClasses[0]
        
        // Fetch class info
        const { data: classData } = await supabase.from('school_classes').select('*').eq('id', classId).single()
        // Fetch students
        const { data: studentsData } = await supabase.from('students').select('*').eq('class_id', classId).order('name')
        
        setData({
          type: 'wali_kelas',
          class_info: classData,
          students: studentsData || [],
          meetings: [], // Dummy for UI metric
        })
      } else {
        // Kepala Sekolah
        let query = supabase.from('school_classes').select('*').order('name')
        if (!targetClasses.includes('ALL')) {
          query = query.in('id', targetClasses)
        }
        const { data: classesData } = await query
        setData({
          type: 'kepala_sekolah',
          classes: classesData || []
        })
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
          attendanceData: [],
          memorizationData: []
        })
        toast.success('Unduhan selesai!', { id: 'zip' })
      } catch (err) {
        console.error(err)
        toast.error('Gagal mengunduh ZIP', { id: 'zip' })
      }
    } else {
      toast.error('Unduh massal Kepala Sekolah belum tersedia') 
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
              className="btn-primary"
              style={{ padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
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
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>{portalMeta.portal_name}</h1>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Kelas: {data.class_info?.name} | Sifat: Read Only</p>
          </div>
          <button onClick={handleDownloadAll} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', display: 'flex', gap: '8px', cursor: 'pointer', alignItems: 'center' }}>
            <Download size={18} />
            Unduh Semua (ZIP)
          </button>
        </header>
        
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Selamat Datang</h2>
            <p style={{ color: 'var(--clr-gray-600)', fontSize: '14px' }}>
              Di portal ini Anda dapat memantau perkembangan hafalan dan absensi siswa secara langsung (Read-Only). Anda tidak dapat mengubah data apa pun.
            </p>
            {portalMeta.notes && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--clr-gray-50)', borderRadius: '8px', fontStyle: 'italic', color: 'var(--clr-gray-700)', fontSize: '14px' }}>
                Catatan: {portalMeta.notes}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)' }}>
              <div style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginBottom: '8px' }}>Total Siswa</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>{data.students?.length || 0}</div>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)' }}>
              <div style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginBottom: '8px' }}>Masa Berlaku Portal</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--clr-gray-900)' }}>
                {portalMeta.expires_at ? new Date(portalMeta.expires_at).toLocaleDateString('id-ID') : 'Selamanya'}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Daftar Siswa</h2>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', overflow: 'hidden' }}>
            {data.students?.map((s:any, i:number) => (
              <div key={s.id} style={{ padding: '16px', borderBottom: i < data.students.length - 1 ? '1px solid var(--clr-gray-100)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{s.name}</span>
                <span style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>NIS: {s.nis || '-'}</span>
              </div>
            ))}
            {data.students?.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--clr-gray-500)' }}>Belum ada siswa di kelas ini.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Dashboard Kepala Sekolah
  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-gray-50)' }}>
      <header style={{ background: 'var(--clr-primary)', color: '#fff', padding: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>{portalMeta.portal_name}</h1>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>Akses Pemantauan: {portalMeta.target_classes.includes('ALL') ? 'Seluruh Kelas' : 'Kelas Terpilih'} | Read Only</p>
      </header>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {portalMeta.notes && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#fff', border: '1px solid var(--clr-gray-200)', borderRadius: '12px', fontStyle: 'italic', color: 'var(--clr-gray-700)', fontSize: '14px' }}>
            Catatan: {portalMeta.notes}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Daftar Kelas (Read-Only)</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {data?.classes?.map((c:any) => (
            <div key={c.id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--clr-primary)' }}>{c.name}</h3>
                  <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>Tahun Ajaran: {c.academic_year}</p>
                </div>
                <button 
                  onClick={() => alert('Fitur detail belum diimplementasi (MVP)')}
                  style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          ))}
          {data?.classes?.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', color: 'var(--clr-gray-500)' }}>
              Tidak ada kelas yang dapat diakses.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
