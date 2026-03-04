'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

type Employee = { id: string; name: string; salary: number; overtime_rate: number }
type Salary = { id: string; employee_name: string; month: string; basic_salary: number; overtime_amount: number; deductions: number; total: number; status: string }

export default function Salaries() {
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ employee_id: '', employee_name: '', month: '', basic_salary: 0, overtime_amount: 0, deductions: 0, total: 0, status: 'معلق' })

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: e }] = await Promise.all([
      db.from('salaries').select('*').order('date', { ascending: false }),
      db.from('employees').select('*').eq('status', 'نشط')
    ])
    setSalaries(s || [])
    setEmployees(e || [])
  }

  function selectEmployee(id: string) {
    const emp = employees.find(x => x.id === id)
    if (emp) {
      setForm({ ...form, employee_id: id, employee_name: emp.name, basic_salary: emp.salary, total: emp.salary })
    }
  }

  function calcTotal(basic: number, overtime: number, deductions: number) {
    return basic + overtime - deductions
  }

  async function save() {
    if (!form.employee_id) return alert('اختار موظف')
    if (!form.month) return alert('اختار الشهر')
    const total = calcTotal(form.basic_salary, form.overtime_amount, form.deductions)
    await db.from('salaries').insert({ ...form, total })
    setShowModal(false)
    setForm({ employee_id: '', employee_name: '', month: '', basic_salary: 0, overtime_amount: 0, deductions: 0, total: 0, status: 'معلق' })
    load()
  }

  async function del(id: string) {
    if (!confirm('حذف سجل الراتب؟')) return
    await db.from('salaries').delete().eq('id', id)
    load()
  }

  async function markPaid(id: string) {
    await db.from('salaries').update({ status: 'مدفوع' }).eq('id', id)
    load()
  }

  const totalPaid = salaries.filter(s => s.status === 'مدفوع').reduce((a, s) => a + Number(s.total || 0), 0)
  const totalPending = salaries.filter(s => s.status === 'معلق').reduce((a, s) => a + Number(s.total || 0), 0)

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>الرواتب 💵</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>إدارة رواتب الموظفين والأوفر تايم</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(245,158,11,.3)' }}>
            + صرف راتب
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي السجلات', value: salaries.length, icon: '📋', color: '#6366f1' },
            { label: 'رواتب مدفوعة', value: totalPaid.toLocaleString() + ' ج.م', icon: '✅', color: '#10b981' },
            { label: 'رواتب معلقة', value: totalPending.toLocaleString() + ' ج.م', icon: '⏳', color: '#ef4444' },
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
              <tr>{['الموظف', 'الشهر', 'الراتب الأساسي', 'أوفر تايم', 'خصومات', 'الإجمالي', 'الحالة', ''].map(h => (
                <th key={h} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {salaries.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>{s.employee_name}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{s.month}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{Number(s.basic_salary).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>+{Number(s.overtime_amount || 0).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>-{Number(s.deductions || 0).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#0f172a' }}>{Number(s.total).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: s.status === 'مدفوع' ? '#dcfce7' : '#fef9c3', color: s.status === 'مدفوع' ? '#16a34a' : '#ca8a04' }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {s.status === 'معلق' && (
                        <button onClick={() => markPaid(s.id)} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>✅ دفع</button>
                      )}
                      <button onClick={() => del(s.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {salaries.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا توجد سجلات رواتب بعد 💵</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>💵 صرف راتب</h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الموظف *</label>
                  <select value={form.employee_id} onChange={e => selectEmployee(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                    <option value="">— اختار موظف —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} — راتب: {e.salary} ج.م</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الشهر *</label>
                  <input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الراتب الأساسي</label>
                    <input type="number" value={form.basic_salary} onChange={e => setForm({ ...form, basic_salary: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>أوفر تايم (ج.م)</label>
                    <input type="number" value={form.overtime_amount} onChange={e => setForm({ ...form, overtime_amount: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>خصومات (ج.م)</label>
                    <input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', color: '#fff', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#94a3b8' }}>الإجمالي</p>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#34d399' }}>{calcTotal(form.basic_salary, form.overtime_amount, form.deductions).toLocaleString()} ج.م</h2>
                </div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                  <option value="معلق">⏳ معلق</option>
                  <option value="مدفوع">✅ مدفوع</option>
                </select>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={save} style={{ flex: 1, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px' }}>💾 حفظ</button>
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
