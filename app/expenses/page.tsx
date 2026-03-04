'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

type Expense = { id: string; title: string; category: string; amount: number; date: string; notes: string }

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', category: '', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await db.from('expenses').select('*').order('date', { ascending: false })
    setExpenses(data || [])
  }

  async function save() {
    if (!form.title) return alert('اكتب عنوان المصروف')
    if (!form.amount) return alert('اكتب المبلغ')
    await db.from('expenses').insert(form)
    setShowModal(false)
    setForm({ title: '', category: '', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' })
    load()
  }

  async function del(id: string) {
    if (!confirm('حذف المصروف؟')) return
    await db.from('expenses').delete().eq('id', id)
    load()
  }

  const filtered = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const categories = ['إيجار', 'كهرباء', 'مياه', 'رواتب', 'مواصلات', 'صيانة', 'تسويق', 'أخرى']
  const totalExpenses = expenses.reduce((a, e) => a + Number(e.amount || 0), 0)
  const thisMonth = expenses.filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7)))
  const thisMonthTotal = thisMonth.reduce((a, e) => a + Number(e.amount || 0), 0)

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>المصروفات 🧾</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>تتبع وإدارة مصروفات الشركة</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(239,68,68,.3)' }}>
            + إضافة مصروف
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي المصروفات', value: totalExpenses.toLocaleString() + ' ج.م', icon: '🧾', color: '#ef4444' },
            { label: 'مصروفات هذا الشهر', value: thisMonthTotal.toLocaleString() + ' ج.م', icon: '📅', color: '#f59e0b' },
            { label: 'عدد السجلات', value: expenses.length, icon: '📋', color: '#6366f1' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالعنوان أو الفئة..."
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['العنوان', 'الفئة', 'المبلغ', 'التاريخ', 'ملاحظات', ''].map(h => (
                <th key={h} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>{e.title}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: '#f1f5f9', color: '#64748b' }}>{e.category || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#ef4444' }}>{Number(e.amount).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#94a3b8' }}>{new Date(e.date).toLocaleDateString('ar-EG')}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b' }}>{e.notes || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => del(e.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا توجد مصروفات بعد 🧾</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>🧾 إضافة مصروف</h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>عنوان المصروف *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: إيجار المحل"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الفئة</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                    <option value="">— اختار فئة —</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>المبلغ (ج.م) *</label>
                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>التاريخ</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>ملاحظات</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات إضافية..."
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={save} style={{ flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px' }}>💾 حفظ</button>
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