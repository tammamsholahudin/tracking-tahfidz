import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, Loader2, Download, CheckCircle2 } from 'lucide-react'
import { generateStudentTemplate, parseStudentExcel } from '@/lib/excel'
import type { StudentImportData } from '@/lib/excel'
import toast from 'react-hot-toast'
import styles from './ImportStudentModal.module.css'

interface ImportStudentModalProps {
  onClose: () => void
  onImportComplete: (data: StudentImportData[], duplicateAction: 'skip' | 'update' | 'new') => void
}

export default function ImportStudentModal({ onClose, onImportComplete }: ImportStudentModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<StudentImportData[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'new'>('skip')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Format file tidak didukung! Gunakan .xlsx, .xls, atau .csv')
      return
    }

    setFile(selected)
    setLoading(true)
    try {
      const data = await parseStudentExcel(selected)
      setPreview(data)
    } catch (err) {
      toast.error('Gagal membaca file Excel. Pastikan format sesuai template.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    setLoading(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p
        return p + 10
      })
    }, 200)

    try {
      await new Promise(r => setTimeout(r, 1500)) // Fake network delay
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        onImportComplete(preview, duplicateAction)
      }, 500)
    } catch (err) {
      clearInterval(interval)
      setLoading(false)
      toast.error('Gagal mengimport data.')
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}><FileSpreadsheet size={20} /> Import Data Siswa</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.body}>
          {/* Download Template Step */}
          {!file && (
            <div className={styles.stepBox}>
              <h3>1. Unduh Template</h3>
              <p>Gunakan template Excel standar agar data dapat dibaca sistem.</p>
              <button className={styles.btnOutline} onClick={generateStudentTemplate}>
                <Download size={16} /> Download Template Excel
              </button>
            </div>
          )}

          {/* Upload Step */}
          {!file && (
            <div className={styles.stepBox}>
              <h3>2. Upload File Excel</h3>
              <div 
                className={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} opacity={0.5} />
                <p>Tap atau klik untuk memilih file (.xlsx, .xls, .csv)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  className={styles.hiddenInput}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* Loading Preview */}
          {loading && !progress && (
            <div className={styles.loadingArea}>
              <Loader2 className={styles.spinner} size={32} />
              <p>Membaca file...</p>
            </div>
          )}

          {/* Preview Step */}
          {file && !loading && progress === 0 && (
            <div className={styles.previewStep}>
              <div className={styles.successBanner}>
                <CheckCircle2 size={16} /> Berhasil membaca {preview.length} baris data
              </div>

              <div className={styles.duplicateConfig}>
                <label><strong>Jika ada NIS ganda:</strong></label>
                <select 
                  className="form-select" 
                  value={duplicateAction}
                  onChange={e => setDuplicateAction(e.target.value as any)}
                >
                  <option value="skip">Lewati (Pertahankan Data Lama)</option>
                  <option value="update">Update Data Lama</option>
                  <option value="new">Buat Data Baru (Ganda)</option>
                </select>
              </div>

              <div className={styles.previewTableWrap}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>NIS</th>
                      <th>Nama</th>
                      <th>L/P</th>
                      <th>Kelas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td>{row.nis}</td>
                        <td>{row.nama}</td>
                        <td>{row.jenisKelamin}</td>
                        <td>{row.kelas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className={styles.moreRows}>... dan {preview.length - 10} baris lainnya</div>
                )}
              </div>

              <button className={styles.btnPrimary} onClick={handleImport}>
                Mulai Import {preview.length} Siswa
              </button>
            </div>
          )}

          {/* Progress Bar (During Import) */}
          {progress > 0 && (
            <div className={styles.progressArea}>
              <h3 className={styles.progressTitle}>Mengimport Data...</h3>
              <div className={styles.progressWrap}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <p>{progress}% Selesai</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
