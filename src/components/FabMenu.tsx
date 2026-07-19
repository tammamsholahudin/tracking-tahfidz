import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import styles from './FabMenu.module.css'

export interface FabAction {
  id: string
  label: string
  icon: React.ReactNode
}

interface FabMenuProps {
  actions: FabAction[]
  onAction: (action: string) => void
}

export default function FabMenu({ actions, onAction }: FabMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAction = (action: string) => {
    setIsOpen(false)
    onAction(action)
  }

  return (
    <div className={styles.fabContainer} ref={menuRef}>
      <div className={`${styles.menu} ${isOpen ? styles.menuOpen : ''}`}>
        {actions.map(action => (
          <button key={action.id} className={styles.menuItem} onClick={() => handleAction(action.id)}>
            <span className={styles.menuLabel}>{action.label}</span>
            <div className={styles.iconWrap}>{action.icon}</div>
          </button>
        ))}
      </div>

      <button
        className={`${styles.fabMain} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Menu Utama"
      >
        <Plus size={24} className={styles.fabIcon} />
      </button>
    </div>
  )
}
