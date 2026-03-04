'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

type Profit = { id: string; product_name: string; quantity: number; cost_price: number; sell_price: number; discount: number; tax: number; profit_before_tax: number; profit_after_tax: number }

export default function Profits() {
  const [profits, setProfits] = useState<Profit[]>([])
  const [expenses, setExpenses] = useState<number>(0)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: p }, { data: e }] = await Promise.all([
      db.from('profits').select('*').order('created_at', { ascending: false }),
      db.from('expenses').select('amount')
    ])
    setProfits(p || [])
    setExpenses((e || []).reduce((a: number, x: any) => a + Number(x.amount || 0), 0))
  }

  const filtered = profits.filter(p =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = profits.reduce((a, p) => a + (p.sell_price * p.quantity), 0)
  const totalCost = profits.reduce((a, p) => a + (p.cost_price * p.quantity), 0)
  const totalProfitBeforeTax = profits.reduce((a, p) => a + Number(p.profit_before_tax || 0), 0)
  const totalProfitAfterTax = profits.reduce((a, p) => a + Number(p.profit_after_tax || 0), 0)
  const netProfit = totalProfitAfterTax - expenses

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>تقرير الأرباح 📈</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>تحليل الأرباح والخسائر بشكل تفصيلي</p>
        </div>

        {/* بطاقات الملخص */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي الإيرادات', value: totalRevenue.toLocaleString() + ' ج.م', icon: '💰', color: '#6366f1', bg: '#6366f120' },
            { label: 'إجمالي التكاليف', value: totalCost.toLocaleString() + ' ج.م', icon: '🏭', color: '#f59e0b', bg: '#f59e0b20' },
            { label: 'ربح قبل الضريبة', value: totalProfitBeforeTax.toLocaleString() + ' ج.م', icon: '📊', color: '#10b981', bg: '#10b98120' },
            { label: 'إجمالي المصروفات', value: expenses.toLocaleString() + ' ج.م', icon: '🧾', color: '#ef4444', bg: '#ef444420' },
            { label: 'صافي الربح', value: netProfit.toLocaleString() + ' ج.م', icon: netProfit >= 0 ? '✅' : '❌', color: netProfit >= 0 ? '#16a34a' : '#dc2626', bg: netProfit >= 0 ? '#dcfce7' : '#fee2e2' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', background: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{s.icon}</div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{s.label}</p>
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: s.color }}>{s.value}</h3>
            </div>
          ))}
        </div>

        {/* صافي الربح الكبير */}
        <div style={{ background: netProfit >= 0 ? 'linear-gradient(135deg,#0f172a,#1e3a5f)' : 'linear-gradient(135deg,#7f1d1d,#991b1b)', borderRadius: '20px', padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#94a3b8' }}>صافي الربح النهائي (بعد المصروفات والضرائب)</p>
            <h2 style={{ margin: 0, fontSize: '36px', fontWeight: '900', color: netProfit >= 0 ? '#34d399' : '#f87171' }}>{netProfit.toLocaleString()} ج.م</h2>
          </div>
          <div style={{ fontSize: '64px' }}>{netProfit >= 0 ? '📈' : '📉'}</div>
        </div>

        {/* البحث */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث باسم المنتج..."
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* الجدول */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['المنتج', 'الكمية', 'سعر الشراء', 'سعر البيع', 'الإيراد', 'التكلفة', 'الربح', 'الربح بعد ض'].map(h => (
                <th key={h} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>{p.product_name}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{p.quantity}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#ef4444' }}>{p.cost_price} ج.م</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6366f1' }}>{p.sell_price} ج.م</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{(p.sell_price * p.quantity).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px' }}>{(p.cost_price * p.quantity).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#10b981' }}>{Number(p.profit_before_tax || 0).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#16a34a' }}>{Number(p.profit_after_tax || 0).toLocaleString()} ج.م</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا توجد بيانات أرباح بعد 📈</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}