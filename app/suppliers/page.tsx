'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

type Supplier = {
  id: string
  name: string
  phone: string
  email: string
  city: string
  supplier_code: string
  balance: number
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await db.from('suppliers').select('*').order('created_at', { ascending: false })
    setSuppliers(data || [])
  }

  async function save() {
    if (!form.name) return alert('اكتب اسم المورد')
    if (editing) {
      await db.from('suppliers').update(form).eq('id', editing.id)
    } else {
      await db.from('suppliers').insert({ ...form, supplier_code: 'SUP-' + Date.now().toString().slice(-5) })
    }
    setShowModal(false)
    setEditing(null)
    setForm({ name: '', phone: '', email: '', city: '' })
    load()
  }

  async function del(id: string) {
    if (!confirm('حذف المورد؟')) return
    await db.from('suppliers').delete().eq('id', id)
    load()
  }

  function edit(s: Supplier) {
    setEditing(s)
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', city: s.city || '' })
    setShowModal(true)
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search) ||
    (s.supplier_code || '').includes(search)
  )

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>الموردين 🚚</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>إدارة موردي المواد والمنتجات</p>
          </div>
          <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', email: '', city: '' }); setShowModal(true) }}
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(99,102,241,.3)' }}>
            + إضافة مورد
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي الموردين', value: suppliers.length, icon: '🚚', color: '#6366f1' },
            { label: 'موردين نشطين', value: suppliers.length, icon: '✅', color: '#10b981' },
            { label: 'إجمالي المديونية', value: suppliers.reduce((a, s) => a + Number(s.balance || 0), 0).toLocaleString() + ' ج.م', icon: '💰', color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: s.color + '20', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{s.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{s.label}</p>
                <h3 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو الهاتف أو الكود..."
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['الكود', 'الاسم', 'الهاتف', 'البريد', 'المدينة', 'الرصيد', 'إجراءات'].map(h => (
                <th key={h} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#6366f1' }}>{s.supplier_code || '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>{s.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{s.phone || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{s.email || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{s.city || '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: Number(s.balance) > 0 ? '#dc2626' : '#64748b' }}>{s.balance || 0} ج.م</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => edit(s)} style={{ background: '#dbeafe', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>✏️</button>
                      <button onClick={() => del(s.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا يوجد موردين بعد 🚚</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{editing ? '✏️ تعديل مورد' : '🚚 إضافة مورد جديد'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>اسم المورد *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الشركة أو المورد"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الهاتف</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.slice(0, 11) })} placeholder="01xxxxxxxxx" maxLength={11}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>البريد الإلكتروني</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>المدينة</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="القاهرة، الإسكندرية..."
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={save} style={{ flex: 1, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px' }}>💾 حفظ</button>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px' }}>إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}