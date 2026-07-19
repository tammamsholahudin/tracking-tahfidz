import { useState, useEffect } from 'react'
import { CreditCard, Plus, Trash2, User, Calendar } from 'lucide-react'
import { moveToTrash } from '@/lib/trash'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import styles from './Memorization.module.css'

interface PaymentPageProps { 
  entityId: string
  entityType?: string
  entityData?: any
}

export default function PaymentPage({ entityId, entityType = 'les' }: PaymentPageProps) {
  const { activeWorkspaceId } = useAuthStore()
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [selectedStudent, setSelectedStudent] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentFor, setPaymentFor] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('Lunas')

  const loadData = () => {
    const allPayments = JSON.parse(localStorage.getItem('tahfidz_payments') || '[]')
    const entityPayments = allPayments.filter((p: any) => p.entity_id === entityId).reverse()
    setPayments(entityPayments)

    // Load students
    let activeStudents = []
    if (entityType === 'les') {
      const allLessonStudents = JSON.parse(localStorage.getItem('tahfidz_lesson_students') || '[]')
      activeStudents = allLessonStudents.filter((s: any) => s.group_id === entityId)
    } else if (entityType === 'privat') {
      const allPrivates = JSON.parse(localStorage.getItem('tahfidz_private_students') || '[]')
      const p = allPrivates.find((x: any) => x.id === entityId)
      if (p) activeStudents = [p]
    }
    setStudents(activeStudents)
    if (activeStudents.length > 0 && !selectedStudent) {
      setSelectedStudent(activeStudents[0].id)
    }
  }

  useEffect(() => {
    loadData()
  }, [entityId, entityType])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStudent || !amount || !paymentDate || !paymentFor) {
      toast.error('Mohon lengkapi data wajib')
      return
    }

    const s = students.find(x => x.id === selectedStudent)
    
    const newPayment = {
      id: `pay-${Date.now()}`,
      entity_id: entityId,
      entity_type: entityType,
      guru_id: activeWorkspaceId,
      student_id: selectedStudent,
      student_name: s ? s.name : 'Unknown',
      amount: parseInt(amount),
      payment_date: paymentDate,
      payment_for: paymentFor,
      note,
      status
    }

    const allPayments = JSON.parse(localStorage.getItem('tahfidz_payments') || '[]')
    localStorage.setItem('tahfidz_payments', JSON.stringify([...allPayments, newPayment]))
    
    toast.success('Pembayaran berhasil dicatat')
    setShowForm(false)
    resetForm()
    loadData()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Hapus data pembayaran ini? Data akan dipindahkan ke Sampah.')) return
    const rec = payments.find(p => p.id === id)
    if (rec) moveToTrash('tahfidz_payments', id, `Pembayaran: ${rec.student_name} (${rec.payment_for})`)
    loadData()
    toast.success('Data dipindahkan ke Sampah')
  }

  const resetForm = () => {
    setAmount('')
    setPaymentFor('')
    setNote('')
    setStatus('Lunas')
    setPaymentDate(new Date().toISOString().split('T')[0])
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
  }

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className={styles.wrap}>
      <div className={styles.headerCard} style={{ background: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 var(--space-2) 0' }}>
            <CreditCard size={20} /> Pencatatan Pembayaran
          </h2>
          <p style={{ color: 'var(--clr-gray-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Catat dan pantau SPP atau biaya pertemuan untuk grup ini.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-gray-500)' }}>Total Terkumpul</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--clr-success)' }}>{formatRupiah(totalCollected)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <button className={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Tambah Pembayaran
        </button>
      </div>

      {showForm && (
        <div className={styles.card} style={{ marginBottom: 'var(--space-4)', border: '1px solid var(--clr-primary-200)', background: 'var(--clr-primary-50)' }}>
          <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Catat Pembayaran Baru
          </h3>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Siswa</label>
              <select className="form-select" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nominal Pembayaran (Rp)</label>
              <input type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Contoh: 150000" required min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Bayar</label>
              <input type="date" className="form-input" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Pembayaran Untuk</label>
              <input type="text" className="form-input" value={paymentFor} onChange={e => setPaymentFor(e.target.value)} placeholder="Contoh: SPP Juli 2026 / Pertemuan 1-4" required />
            </div>
            <div className="form-group">
              <label className="form-label">Metode / Catatan</label>
              <input type="text" className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Contoh: Transfer BCA" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Lunas">Lunas</option>
                <option value="Sebagian">Sebagian</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="submit" className={styles.btnPrimary}>Simpan Pembayaran</button>
              <button type="button" className={styles.btnOutline} onClick={() => { setShowForm(false); resetForm(); }}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <div className={styles.desktopTable}>
            <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Siswa</th>
                <th>Nominal</th>
                <th>Pembayaran Untuk</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--clr-gray-400)' }}>
                    Belum ada riwayat pembayaran.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--clr-gray-400)" />
                        {new Date(p.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                        <User size={14} color="var(--clr-primary-500)" />
                        {p.student_name}
                      </div>
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--clr-gray-800)' }}>
                      {formatRupiah(p.amount)}
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{p.payment_for}</div>
                      {p.note && <div style={{ fontSize: '11px', color: 'var(--clr-gray-500)' }}>{p.note}</div>}
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        background: p.status === 'Lunas' ? 'var(--clr-success-light)' : 'var(--clr-warning-light)',
                        color: p.status === 'Lunas' ? 'var(--clr-success)' : 'var(--clr-warning)'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={styles.btnAction} style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(p.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          <div className={styles.mobileCards}>
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--clr-gray-400)' }}>
                Belum ada riwayat pembayaran.
              </div>
            ) : (
              payments.map(p => (
                <div key={p.id} className={styles.mCard}>
                  <div className={styles.mCardHeader}>
                    <div className={styles.mCardTitleWrap}>
                      <div className={styles.mCardDate}>{new Date(p.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className={styles.mCardTitle}>{p.student_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={styles.mScore}>{formatRupiah(p.amount)}</span>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        background: p.status === 'Lunas' ? 'var(--clr-success-light)' : 'var(--clr-warning-light)',
                        color: p.status === 'Lunas' ? 'var(--clr-success)' : 'var(--clr-warning)',
                        display: 'inline-block',
                        marginTop: '4px'
                      }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                  <div className={styles.mCardInfo}>
                    <div className={styles.mCardFor}>{p.payment_for}</div>
                    {p.note && <div className={styles.mCardNote}>{p.note}</div>}
                  </div>
                  <div className={styles.mCardFooter}>
                    <button className={styles.btnAction} style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(p.id)}>
                      <Trash2 size={16} /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
