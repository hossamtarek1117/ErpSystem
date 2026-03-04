'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

type Employee = {
  id: string
  name: string
  position: string
  department: string
  salary: number
  overtime_rate: number
  status: string
  employee_code: string
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', position: '', department: '', salary: 0, overtime_rate: 0, status: 'نشط' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await db.from('employees').select('*').order('created_at', { ascending: false })
    setEmployees(data || [])
  }

  async function save() {
    if (!form.name) return alert('اكتب اسم الموظف')
    if (editing) {
      await db.from('employees').update(form).eq('id', editing.id)
    } else {
      await db.from('employees').insert({ ...form, employee_code: 'EMP-' + Date.now().toString().slice(-5) })
    }
    setShowModal(false)
    setEditing(null)
    setForm({ name: '', position: '', department: '', salary: 0, overtime_rate: 0, status: 'نشط' })
    load()
  }

  async function del(id: string) {
    if (!confirm('حذف الموظف؟')) return
    await db.from('employees').delete().eq('id', id)
    load()
  }

  function edit(e: Employee) {
    setEditing(e)
    setForm({ name: e.name, position: e.position || '', department: e.department || '', salary: e.salary || 0, overtime_rate: e.overtime_rate || 0, status: e.status || 'نشط' })
    setShowModal(true)
  }

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').includes(search) ||
    (e.employee_code || '').includes(search)
  )

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))]

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>الموظفين 👥</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>إدارة بيانات الموظفين والرواتب</p>
          </div>
          <button onClick={() => { setEditing(null); setForm({ name: '', position: '', department: '', salary: 0, overtime_rate: 0, status: 'نشط' }); setShowModal(true) }}
            style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(236,72,153,.3)' }}>
            + إضافة موظف
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي الموظفين', value: employees.length, icon: '👥', color: '#6366f1' },
            { label: 'موظفين نشطين', value: employees.filter(e => e.status === 'نشط').length, icon: '✅', color: '#10b981' },
            { label: 'إجمالي الرواتب', value: employees.reduce((a, e) => a + Number(e.salary || 0), 0).toLocaleString() + ' ج.م', icon: '💰', color: '#f59e0b' },
            { label: 'الأقسام', value: departments.length, icon: '🏢', color: '#ec4899' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو القسم أو الكود..."
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['الكود', 'الاسم', 'الوظيفة', 'القسم', 'الراتب', 'ساعة أوفر تايم', 'الحالة', 'إجراءات'].map(h => (
                <th key={h} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#ec4899' }}>{e.employee_code || '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>{e.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{e.position || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{e.department || '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#16a34a' }}>{Number(e.salary || 0).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{e.overtime_rate || 0} ج.م/ساعة</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: e.status === 'نشط' ? '#dcfce7' : '#fee2e2', color: e.status === 'نشط' ? '#16a34a' : '#dc2626' }}>{e.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => edit(e)} style={{ background: '#dbeafe', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>✏️</button>
                      <button onClick={() => del(e.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا يوجد موظفين بعد 👥</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{editing ? '✏️ تعديل موظف' : '👤 إضافة موظف جديد'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>اسم الموظف *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="الاسم الكامل"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الوظيفة</label>
                    <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="مدير / محاسب..."
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>القسم</label>
                    <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="المبيعات / المحاسبة..."
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الراتب الأساسي (ج.م)</label>
                    <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>سعر ساعة أوفر تايم (ج.م)</label>
                    <input type="number" value={form.overtime_rate} onChange={e => setForm({ ...form, overtime_rate: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الحالة</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                    <option value="نشط">✅ نشط</option>
                    <option value="إجازة">🏖️ إجازة</option>
                    <option value="متوقف">❌ متوقف</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={save} style={{ flex: 1, background: 'linear-gradient(135deg,#ec4899,#db2777)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px' }}>💾 حفظ</button>
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