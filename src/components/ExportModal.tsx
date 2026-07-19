import { useState } from 'react'
import { X, FileDown } from 'lucide-react'
import styles from './ExportModal.module.css'

interface ExportModalProps {
  onClose: () => void
  onExport: (format: 'excel' | 'pdf', filter: any) => void
  type: 'absensi' | 'hafalan'
}

export default function ExportModal({ onClose, onExport, type }: ExportModalProps) {
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel')
  const [semester] = useState('Semua')
  const [tahunAjaran] = useState('2026/2027')

  const handleExport = () => {
    onExport(format, { semester, tahunAjaran })
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <FileDown size={20} /> Export Laporan {type === 'absensi' ? 'Absensi' : 'Hafalan'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.body}>
          <div className={styles.formatSelect}>
            <label className={styles.radioCard}>
              <input type="radio" name="format" checked={format === 'excel'} onChange={() => setFormat('excel')} />
              <div className={styles.radioContent}>
                <strong>📊 Excel (.xlsx)</strong>
                <span>Format tabel yang bisa diedit</span>
              </div>
            </label>
            
            <label className={styles.radioCard}>
              <input type="radio" name="format" checked={format === 'pdf'} onChange={() => setFormat('pdf')} />
              <div className={styles.radioContent}>
                <strong>📄 PDF (.pdf)</strong>
                <span>Format rapi siap cetak</span>
              </div>
            </label>
          </div>

          <button className={styles.btnPrimary} onClick={handleExport}>
            Download Laporan {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}
