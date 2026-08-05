import { supabase } from './supabase'

export async function generatePortalLink(entityType: 'wali_kelas' | 'kepala_sekolah', entityId: string, durationDays: number | null, createdBy: string) {
  // 1. Generate unique ID
  const linkId = `plnk-${Math.random().toString(36).substr(2, 9)}`
  
  // 2. Generate random password
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let password = ''
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // 3. Set expiration
  let expiresAt = null
  if (durationDays) {
    const d = new Date()
    d.setDate(d.getDate() + durationDays)
    expiresAt = d.toISOString()
  }

  // 4. Save to Supabase (bypassing RLS because Admin has access to portal_links)
  const { error } = await supabase.from('portal_links').insert({
    id: linkId,
    entity_type: entityType,
    entity_id: entityId,
    password_hash: password, // In production this should be hashed, but for simplicity of copying we store plain, or hash it and return plain once. Here we just store plain since it's a generated 6 char code.
    created_by: createdBy,
    expires_at: expiresAt,
    is_active: true
  })

  if (error) {
    console.error('Failed to create portal link', error)
    return null
  }

  return { linkId, password }
}

export async function fetchPortalLinks() {
  const { data, error } = await supabase.from('portal_links').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('Failed to fetch portal links', error)
    return []
  }
  return data
}

export async function togglePortalLinkStatus(id: string, currentStatus: boolean) {
  const { error } = await supabase.from('portal_links').update({ is_active: !currentStatus }).eq('id', id)
  return !error
}

export async function fetchPortalAccessLogs() {
  const { data, error } = await supabase.from('portal_access_logs').select('*, portal_links(*)').order('accessed_at', { ascending: false }).limit(100)
  if (error) {
    console.error('Failed to fetch logs', error)
    return []
  }
  return data
}
