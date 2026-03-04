'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

type Employee = { id: string; name: string }
type Attendance = { id: string; employee_name: string; date: string; check_in: string; check_out: string; overtime_hours: number; status: string }

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ employee_id: '', employee_name: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', overtime_hours: 0, status: 'حاضر' })

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: a }, { data: e }] = await Promise.all([
      db.from('attendance').select('*').order('date', { ascending: false }),
      db.from('employees').select('*').eq('status', 'نشط')
    ])
    setRecords(a || [])
    setEmployees(e || [])
  }

  async function save() {
    if (!form.employee_id) return alert('اختار موظف')
    await db.from('attendance').insert(form)
    setShowModal(false)
    setForm({ employee_id: '', employee_name: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', overtime_hours: 0, status: 'حاضر' })
    load()
  }

  async function del(id: string) {
    if (!confirm('حذف السجل؟')) return
    await db.from('attendance').delete().eq('id', id)
    load()
  }

  const today = records.filter(r => r.date === new Date().toISOString().split('T')[0])
  const presentToday = today.filter(r => r.status === 'حاضر').length
  const absentToday = today.filter(r => r.status === 'غائب').length

  const statusColor: Record<string, { bg: string; color: string }> = {
    'حاضر': { bg: '#dcfce7', color: '#16a34a' },
    'غائب': { bg: '#fee2e2', color: '#dc2626' },
    'إجازة': { bg: '#fef9c3', color: '#ca8a04' },
    'متأخر': { bg: '#fde8d8', color: '#ea580c' },
  }

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>الحضور والغياب 🕐</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>تتبع حضور وغياب الموظفين يومياً</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(99,102,241,.3)' }}>
            + تسجيل حضور
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي السجلات', value: records.length, icon: '📋', color: '#6366f1' },
            { label: 'حاضرين اليوم', value: presentToday, icon: '✅', color: '#10b981' },
            { label: 'غائبين اليوم', value: absentToday, icon: '❌', color: '#ef4444' },
            { label: 'إجمالي الأوفر تايم', value: records.reduce((a, r) => a + Number(r.overtime_hours || 0), 0) + ' ساعة', icon: '⏰', color: '#f59e0b' },
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

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['الموظف', 'التاريخ', 'وقت الدخول', 'وقت الخروج', 'أوفر تايم', 'الحالة', ''].map(h => (
                <th key={h} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>{r.employee_name}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{new Date(r.date).toLocaleDateString('ar-EG')}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{r.check_in || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>{r.check_out || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#f59e0b' }}>{r.overtime_hours || 0} ساعة</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: statusColor[r.status]?.bg || '#f1f5f9', color: statusColor[r.status]?.color || '#64748b' }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => del(r.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا توجد سجلات حضور بعد 🕐</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>🕐 تسجيل حضور</h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الموظف *</label>
                  <select value={form.employee_id} onChange={e => { const emp = employees.find(x => x.id === e.target.value); setForm({ ...form, employee_id: e.target.value, employee_name: emp?.name || '' }) }}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                    <option value="">— اختار موظف —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>التاريخ</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>⏰ وقت الدخول</label>
                    <input type="time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>⏰ وقت الخروج</label>
                    <input type="time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>ساعات أوفر تايم</label>
                    <input type="number" value={form.overtime_hours} onChange={e => setForm({ ...form, overtime_hours: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الحالة</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                      <option value="حاضر">✅ حاضر</option>
                      <option value="غائب">❌ غائب</option>
                      <option value="إجازة">🏖️ إجازة</option>
                      <option value="متأخر">⚠️ متأخر</option>
                    </select>
                  </div>
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