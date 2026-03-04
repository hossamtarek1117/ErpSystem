'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

type Activity = { id: string; action: string; details: string; user_name: string; created_at: string }

export default function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await db.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200)
    setActivities(data || [])
  }

  async function clearAll() {
    if (!confirm('مسح كل سجل الأنشطة؟')) return
    await db.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    load()
  }

  const filtered = activities.filter(a =>
    (a.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.details || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.user_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const actionColor: Record<string, { bg: string; color: string }> = {
    'بيع': { bg: '#dcfce7', color: '#16a34a' },
    'شراء': { bg: '#dbeafe', color: '#2563eb' },
    'إضافة': { bg: '#f0fdf4', color: '#16a34a' },
    'تعديل': { bg: '#fef9c3', color: '#ca8a04' },
    'حذف': { bg: '#fee2e2', color: '#dc2626' },
    'تسجيل دخول': { bg: '#f3e8ff', color: '#9333ea' },
  }

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>سجل الأنشطة 📋</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>تتبع كل العمليات والتغييرات في النظام</p>
          </div>
          <button onClick={clearAll}
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px' }}>
            🗑️ مسح السجل
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي الأنشطة', value: activities.length, icon: '📋', color: '#6366f1' },
            { label: 'أنشطة اليوم', value: activities.filter(a => a.created_at?.startsWith(new Date().toISOString().split('T')[0])).length, icon: '📅', color: '#10b981' },
            { label: 'آخر نشاط', value: activities[0] ? new Date(activities[0].created_at).toLocaleTimeString('ar-EG') : '—', icon: '⏰', color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: s.color + '20', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{s.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{s.label}</p>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث في السجل..."
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا توجد أنشطة بعد 📋</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', borderRight: '4px solid #6366f1' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: actionColor[a.action]?.bg || '#f1f5f9', color: actionColor[a.action]?.color || '#64748b' }}>{a.action}</span>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{a.details}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>👤 {a.user_name || 'النظام'}</span>
                      <span>🕐 {new Date(a.created_at).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}