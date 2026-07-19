import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppSettings {
  institutionName: string
  institutionSubtitle: string
}

interface SettingsState extends AppSettings {
  updateSettings: (updates: Partial<AppSettings>) => void
}

export const DEFAULT_INSTITUTION_NAME = 'MADRASAH ALIYAH MUHAMMADIYAH'
export const DEFAULT_INSTITUTION_SUBTITLE = 'Tracking Tahfidz MAM!'

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      institutionName: DEFAULT_INSTITUTION_NAME,
      institutionSubtitle: DEFAULT_INSTITUTION_SUBTITLE,

      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    {
      name: 'tahfidz-mam-settings',
    }
  )
)

/** Helper – baca nilai dari localStorage langsung (untuk digunakan di luar React component, misal di pdf.ts / excel.ts) */
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('tahfidz-mam-settings')
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Partial<AppSettings> }
      return {
        institutionName: parsed.state?.institutionName ?? DEFAULT_INSTITUTION_NAME,
        institutionSubtitle: parsed.state?.institutionSubtitle ?? DEFAULT_INSTITUTION_SUBTITLE,
      }
    }
  } catch { /* ignore */ }
  return {
    institutionName: DEFAULT_INSTITUTION_NAME,
    institutionSubtitle: DEFAULT_INSTITUTION_SUBTITLE,
  }
}
