'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

type Product = { id: string; name: string; quantity: number; sell_price: number; cost_price: number }
type Client = { id: string; name: string }
type SaleItem = { inventory_id: string; product_name: string; quantity: number; sell_price: number; cost_price: number; total: number }
type Sale = { id: string; invoice_number: string; client_name: string; total: number; status: string; date: string; discount: number; tax: number; subtotal: number }

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showModal, setShowModal] = useState(false)
  const [items, setItems] = useState<SaleItem[]>([])
  const [form, setForm] = useState({ client_id: '', client_name: '', discount: 0, tax: 0, status: 'مدفوع', notes: '' })
  const [selProd, setSelProd] = useState('')
  const [selQty, setSelQty] = useState(1)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: p }, { data: c }] = await Promise.all([
      db.from('sales').select('*').order('date', { ascending: false }),
      db.from('inventory').select('*').gt('quantity', 0),
      db.from('clients').select('*')
    ])
    setSales(s || [])
    setProducts(p || [])
    setClients(c || [])
  }

  function addItem() {
    const p = products.find(x => x.id === selProd)
    if (!p) return alert('اختار منتج أولاً')
    if (selQty > p.quantity) return alert('الكمية أكبر من المخزون المتاح!')
    const exist = items.find(i => i.inventory_id === selProd)
    if (exist) {
      setItems(items.map(i => i.inventory_id === selProd ? { ...i, quantity: i.quantity + selQty, total: (i.quantity + selQty) * i.sell_price } : i))
    } else {
      setItems([...items, { inventory_id: p.id, product_name: p.name, quantity: selQty, sell_price: p.sell_price, cost_price: p.cost_price, total: selQty * p.sell_price }])
    }
    setSelProd('')
    setSelQty(1)
  }

  const subtotal = items.reduce((a, i) => a + i.total, 0)
  const discountAmt = Number(form.discount) || 0
  const taxAmt = Number(form.tax) || 0
  const total = subtotal - discountAmt + taxAmt

  async function saveSale() {
    if (items.length === 0) return alert('أضف منتجات للفاتورة أولاً')
    const invoice_number = 'INV-' + Date.now().toString().slice(-6)
    const { data: sale } = await db.from('sales').insert({
      invoice_number, client_id: form.client_id || null, client_name: form.client_name,
      subtotal, discount: discountAmt, tax: taxAmt, total, status: form.status, notes: form.notes
    }).select().single()
    if (sale) {
      await db.from('sale_items').insert(items.map(i => ({ sale_id: sale.id, ...i })))
      for (const item of items) {
        const prod = products.find(p => p.id === item.inventory_id)
        if (prod) await db.from('inventory').update({ quantity: prod.quantity - item.quantity }).eq('id', item.inventory_id)
        await db.from('profits').insert({
          sale_id: sale.id, product_name: item.product_name, quantity: item.quantity,
          cost_price: item.cost_price, sell_price: item.sell_price,
          discount: discountAmt / items.length, tax: taxAmt / items.length,
          profit_before_tax: (item.sell_price - item.cost_price) * item.quantity,
          profit_after_tax: (item.sell_price - item.cost_price) * item.quantity - (taxAmt / items.length)
        })
      }
    }
    setShowModal(false)
    setItems([])
    setForm({ client_id: '', client_name: '', discount: 0, tax: 0, status: 'مدفوع', notes: '' })
    load()
  }

  async function del(id: string) {
    if (!confirm('حذف الفاتورة؟')) return
    await db.from('sales').delete().eq('id', id)
    load()
  }

  const statusColor: Record<string, { bg: string; color: string }> = {
    'مدفوع': { bg: '#dcfce7', color: '#16a34a' },
    'آجل': { bg: '#fee2e2', color: '#dc2626' },
    'جزئي': { bg: '#fef9c3', color: '#ca8a04' },
  }

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>المبيعات والفواتير 💰</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>إدارة الفواتير وتتبع المبيعات</p>
          </div>
          <button onClick={() => { setShowModal(true); setItems([]); setForm({ client_id: '', client_name: '', discount: 0, tax: 0, status: 'مدفوع', notes: '' }) }}
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(99,102,241,.3)' }}>
            + فاتورة جديدة
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي الفواتير', value: sales.length, icon: '🧾', color: '#6366f1' },
            { label: 'إجمالي المبيعات', value: sales.reduce((a, s) => a + Number(s.total || 0), 0).toLocaleString() + ' ج.م', icon: '💰', color: '#10b981' },
            { label: 'فواتير آجلة', value: sales.filter(s => s.status === 'آجل').length, icon: '⏳', color: '#ef4444' },
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

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['رقم الفاتورة', 'العميل', 'المجموع', 'خصم', 'ضريبة', 'الصافي', 'الحالة', 'التاريخ', ''].map(h => (
                <th key={h} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '700', borderRadius: '8px' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#6366f1' }}>{s.invoice_number}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '600' }}>{s.client_name || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{Number(s.subtotal || s.total).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', color: '#dc2626' }}>{s.discount ? s.discount + ' ج.م' : '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#f59e0b' }}>{s.tax ? s.tax + ' ج.م' : '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#16a34a' }}>{Number(s.total).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: statusColor[s.status]?.bg || '#f1f5f9', color: statusColor[s.status]?.color || '#64748b' }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8' }}>{new Date(s.date).toLocaleDateString('ar-EG')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => del(s.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا توجد فواتير بعد — ابدأ بإنشاء فاتورة جديدة 🧾</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '660px', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>📋 فاتورة مبيعات جديدة</h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>

              {/* Client */}
              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 10px', fontWeight: '700', fontSize: '14px', color: '#374151' }}>👤 بيانات العميل</p>
                <select value={form.client_id} onChange={e => { const c = clients.find(x => x.id === e.target.value); setForm({ ...form, client_id: e.target.value, client_name: c?.name || '' }) }}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', marginBottom: '10px' }}>
                  <option value="">— اختار عميل من القائمة —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!form.client_id && (
                  <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="أو اكتب اسم العميل مباشرةً" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                )}
              </div>

              {/* Products */}
              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 10px', fontWeight: '700', fontSize: '14px', color: '#374151' }}>📦 إضافة منتجات</p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <select value={selProd} onChange={e => setSelProd(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                    <option value="">— اختار منتج —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} | متاح: {p.quantity} | سعر: {p.sell_price} ج.م</option>)}
                  </select>
                  <input type="number" value={selQty} onChange={e => setSelQty(Number(e.target.value))} min={1} placeholder="كمية"
                    style={{ width: '90px', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', textAlign: 'center' }} />
                  <button onClick={addItem} style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', whiteSpace: 'nowrap' }}>+ إضافة</button>
                </div>
                {items.length > 0 && (
                  <div>
                    {items.map(i => (
                      <div key={i.inventory_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', borderRadius: '10px', marginBottom: '6px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>{i.product_name}</span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>x{i.quantity} × {i.sell_price} ج.م</span>
                        <span style={{ fontWeight: '700', color: '#10b981' }}>{i.total} ج.م</span>
                        <button onClick={() => setItems(items.filter(x => x.inventory_id !== i.inventory_id))} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {items.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: '8px 0 0' }}>لم تُضف منتجات بعد</p>}
              </div>

              {/* Pricing */}
              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 12px', fontWeight: '700', fontSize: '14px', color: '#374151' }}>💲 تفاصيل السعر</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>🏷️ خصم (ج.م)</label>
                    <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} min={0} placeholder="0"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>📊 ضريبة (ج.م)</label>
                    <input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: Number(e.target.value) })} min={0} placeholder="0"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', marginBottom: '12px' }}>
                  <option value="مدفوع">✅ مدفوع بالكامل</option>
                  <option value="آجل">⏳ آجل (دين)</option>
                  <option value="جزئي">💳 مدفوع جزئياً</option>
                </select>
                {items.length > 0 && (
                  <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>المجموع الفرعي</span>
                      <span>{subtotal.toLocaleString()} ج.م</span>
                    </div>
                    {discountAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>خصم</span>
                      <span style={{ color: '#f87171' }}>— {discountAmt} ج.م</span>
                    </div>}
                    {taxAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>ضريبة</span>
                      <span style={{ color: '#fbbf24' }}>+ {taxAmt} ج.م</span>
                    </div>}
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800' }}>
                      <span>الإجمالي</span>
                      <span style={{ color: '#34d399' }}>{total.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveSale} style={{ flex: 1, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '16px', boxShadow: '0 4px 15px rgba(99,102,241,.3)' }}>💾 حفظ الفاتورة</button>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '16px' }}>إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}