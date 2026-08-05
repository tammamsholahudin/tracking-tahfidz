import { supabase } from './supabase'

export async function generatePortalLink(
  entityType: 'wali_kelas' | 'kepala_sekolah', 
  portalName: string,
  targetClasses: string[], 
  durationDays: number | null, 
  customPassword: string | null,
  notes: string,
  createdBy: string
) {
  // 1. Generate unique ID
  const linkId = `plnk-${Math.random().toString(36).substr(2, 9)}`
  
  // 2. Determine password
  let password = customPassword
  if (!password) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    password = ''
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
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
    portal_name: portalName,
    target_classes: targetClasses,
    password_hash: password, // In production this should be hashed, but for simplicity of copying we store plain, or hash it and return plain once. Here we just store plain since it's a generated 6 char code.
    created_by: createdBy,
    expires_at: expiresAt,
    notes: notes,
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

export async function updatePortalPassword(id: string, newPassword: string) {
  const { error } = await supabase.from('portal_links').update({ password_hash: newPassword }).eq('id', id)
  return !error
}

export async function deletePortalLink(id: string) {
  const { error } = await supabase.from('portal_links').delete().eq('id', id)
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

export async function validatePortalAccess(id: string, passwordAttempt: string) {
  const { data, error } = await supabase.from('portal_links')
    .select('*')
    .eq('id', id)
    .single()
    
  if (error || !data) return { success: false, error: 'Tautan tidak ditemukan.' }
  if (!data.is_active) return { success: false, error: 'Tautan ini sudah dinonaktifkan.' }
  
  if (data.expires_at) {
    if (new Date(data.expires_at) < new Date()) {
      return { success: false, error: 'Tautan ini telah kedaluwarsa.' }
    }
  }

  if (data.password_hash !== passwordAttempt) {
    return { success: false, error: 'Sandi salah.' }
  }

  // Success - log it
  await supabase.from('portal_access_logs').insert({
    portal_id: id,
    user_agent: navigator.userAgent
  })

  return { success: true, data }
}
