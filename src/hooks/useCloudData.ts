import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * useCloudData (SWR Pattern)
 * 1. Langsung mengembalikan data dari cache lokal (cepat).
 * 2. Secara asinkron mengambil data terbaru dari Supabase.
 * 3. Jika berbeda, perbarui cache lokal dan re-render.
 */
export function useCloudData<T>(
  table: string, 
  cacheKey: string,
  options?: {
    filterColumn?: string;
    filterValue?: any;
    orderBy?: string;
    ascending?: boolean;
  }
) {
  const [data, setData] = useState<T[]>(() => {
    // Initial Load dari Cache
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey)
      if (cached) return JSON.parse(cached)
    }
    return []
  })
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFromCloud = async () => {
      try {
        let query = supabase.from(table).select('*')
        
        if (options?.filterColumn && options?.filterValue) {
          query = query.eq(options.filterColumn, options.filterValue)
        }
        
        if (options?.orderBy) {
          query = query.order(options.orderBy, { ascending: options.ascending ?? true })
        }

        const { data: cloudData, error } = await query
        
        if (error) throw error

        if (cloudData) {
          localStorage.setItem(cacheKey, JSON.stringify(cloudData))
          setData(cloudData as T[])
        }
      } catch (err) {
        console.error(`Failed to fetch ${table} from cloud, using cache only:`, err)
      } finally {
        setIsLoading(false)
      }
    }

    if (navigator.onLine) {
      fetchFromCloud()
    } else {
      setIsLoading(false)
    }

    // Listener for Optimistic UI updates from db.ts
    const handleLocalUpdate = () => {
      const cached = localStorage.getItem(cacheKey)
      if (cached) setData(JSON.parse(cached))
    }

    window.addEventListener('local_cache_updated', handleLocalUpdate)
    return () => window.removeEventListener('local_cache_updated', handleLocalUpdate)
  }, [table, cacheKey, options?.filterColumn, options?.filterValue, options?.orderBy, options?.ascending])

  return { data, isLoading }
}
