'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

type Supplier = { id: string; name: string }
type Product = { id: string; name: string; quantity: number; cost_price: number }
type PurchaseItem = { inventory_id: string; product_name: string; quantity: number; cost_price: number; total: number }
type Purchase = { id: string; invoice_number: string; supplier_name: string; total: number; status: string; date: string; discount: number; tax: number }

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [form, setForm] = useState({ supplier_id: '', supplier_name: '', discount: 0, tax: 0, status: 'مدفوع', notes: '' })
  const [selProd, setSelProd] = useState('')
  const [selQty, setSelQty] = useState(1)
  const [selPrice, setSelPrice] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: p }, { data: s }, { data: pr }] = await Promise.all([
      db.from('purchases').select('*').order('date', { ascending: false }),
      db.from('suppliers').select('*'),
      db.from('inventory').select('*')
    ])
    setPurchases(p || [])
    setSuppliers(s || [])
    setProducts(pr || [])
  }

  function addItem() {
    const p = products.find(x => x.id === selProd)
    if (!p) return alert('اختار منتجاً أولاً')
    if (selQty <= 0) return alert('الكمية لازم تكون أكبر من صفر')
    if (selPrice <= 0) return alert('اكتب سعر الشراء')
    const exist = items.find(i => i.inventory_id === selProd)
    if (exist) {
      setItems(items.map(i => i.inventory_id === selProd ? { ...i, quantity: i.quantity + selQty, total: (i.quantity + selQty) * selPrice } : i))
    } else {
      setItems([...items, { inventory_id: p.id, product_name: p.name, quantity: selQty, cost_price: selPrice, total: selQty * selPrice }])
    }
    setSelProd('')
    setSelQty(1)
    setSelPrice(0)
  }

  const subtotal = items.reduce((a, i) => a + i.total, 0)
  const discountAmt = Number(form.discount) || 0
  const taxAmt = Number(form.tax) || 0
  const total = subtotal - discountAmt + taxAmt

  async function savePurchase() {
    if (items.length === 0) return alert('أضف منتجات للفاتورة أولاً')
    const invoice_number = 'PUR-' + Date.now().toString().slice(-6)
    const { data: purchase } = await db.from('purchases').insert({
      invoice_number, supplier_id: form.supplier_id || null, supplier_name: form.supplier_name,
      subtotal, discount: discountAmt, tax: taxAmt, total, status: form.status, notes: form.notes
    }).select().single()
    if (purchase) {
      await db.from('purchase_items').insert(items.map(i => ({ purchase_id: purchase.id, ...i })))
      for (const item of items) {
        const prod = products.find(p => p.id === item.inventory_id)
        if (prod) {
          await db.from('inventory').update({
            quantity: prod.quantity + item.quantity,
            cost_price: item.cost_price
          }).eq('id', item.inventory_id)
        }
      }
    }
    setShowModal(false)
    setItems([])
    setForm({ supplier_id: '', supplier_name: '', discount: 0, tax: 0, status: 'مدفوع', notes: '' })
    load()
  }

  async function del(id: string) {
    if (!confirm('حذف فاتورة الشراء؟')) return
    await db.from('purchases').delete().eq('id', id)
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>المشتريات 🛒</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>إدارة فواتير الشراء وتحديث المخزون</p>
          </div>
          <button onClick={() => { setShowModal(true); setItems([]); setForm({ supplier_id: '', supplier_name: '', discount: 0, tax: 0, status: 'مدفوع', notes: '' }) }}
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(16,185,129,.3)' }}>
            + فاتورة شراء جديدة
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي الفواتير', value: purchases.length, icon: '🛒', color: '#6366f1' },
            { label: 'إجمالي المشتريات', value: purchases.reduce((a, p) => a + Number(p.total || 0), 0).toLocaleString() + ' ج.م', icon: '💰', color: '#10b981' },
            { label: 'فواتير آجلة', value: purchases.filter(p => p.status === 'آجل').length, icon: '⏳', color: '#ef4444' },
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

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['رقم الفاتورة', 'المورد', 'المجموع', 'خصم', 'ضريبة', 'الصافي', 'الحالة', 'التاريخ', ''].map(h => (
                <th key={h} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#10b981' }}>{p.invoice_number}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '600' }}>{p.supplier_name || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{Number(p.total).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px', color: '#dc2626' }}>{p.discount ? p.discount + ' ج.م' : '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#f59e0b' }}>{p.tax ? p.tax + ' ج.م' : '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#16a34a' }}>{Number(p.total).toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: statusColor[p.status]?.bg || '#f1f5f9', color: statusColor[p.status]?.color || '#64748b' }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8' }}>{new Date(p.date).toLocaleDateString('ar-EG')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => del(p.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '600', fontSize: '13px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '15px' }}>لا توجد فواتير شراء بعد 🛒</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '660px', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>🛒 فاتورة شراء جديدة</h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 10px', fontWeight: '700', fontSize: '14px', color: '#374151' }}>🚚 بيانات المورد</p>
                <select value={form.supplier_id} onChange={e => { const s = suppliers.find(x => x.id === e.target.value); setForm({ ...form, supplier_id: e.target.value, supplier_name: s?.name || '' }) }}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', marginBottom: '10px' }}>
                  <option value="">— اختار مورد من القائمة —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {!form.supplier_id && (
                  <input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} placeholder="أو اكتب اسم المورد مباشرةً"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                )}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 10px', fontWeight: '700', fontSize: '14px', color: '#374151' }}>📦 إضافة منتجات</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '10px', marginBottom: '12px' }}>
                  <select value={selProd} onChange={e => { setSelProd(e.target.value); const p = products.find(x => x.id === e.target.value); setSelPrice(p?.cost_price || 0) }}
                    style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                    <option value="">— اختار منتج —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>الكمية</label>
                    <input type="number" value={selQty} onChange={e => setSelQty(Number(e.target.value))} min={1}
                      style={{ width: '80px', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', textAlign: 'center' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>سعر الشراء</label>
                    <input type="number" value={selPrice} onChange={e => setSelPrice(Number(e.target.value))} min={0}
                      style={{ width: '100px', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', textAlign: 'center' }} />
                  </div>
                  <button onClick={addItem} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', alignSelf: 'flex-end' }}>+ إضافة</button>
                </div>

                {items.map(i => (
                  <div key={i.inventory_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', borderRadius: '10px', marginBottom: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', flex: 1 }}>{i.product_name}</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>x{i.quantity} × {i.cost_price} ج.م</span>
                    <span style={{ fontWeight: '700', color: '#10b981', marginRight: '12px' }}>{i.total} ج.م</span>
                    <button onClick={() => setItems(items.filter(x => x.inventory_id !== i.inventory_id))} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                {items.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>لم تُضف منتجات بعد</p>}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 12px', fontWeight: '700', fontSize: '14px', color: '#374151' }}>💲 تفاصيل السعر</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>🏷️ خصم (ج.م)</label>
                    <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>📊 ضريبة (ج.م)</label>
                    <input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: Number(e.target.value) })} min={0}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', marginBottom: '12px' }}>
                  <option value="مدفوع">✅ مدفوع بالكامل</option>
                  <option value="آجل">⏳ آجل</option>
                  <option value="جزئي">💳 مدفوع جزئياً</option>
                </select>
                {items.length > 0 && (
                  <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>المجموع الفرعي</span>
                      <span>{subtotal.toLocaleString()} ج.م</span>
                    </div>
                    {discountAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>خصم</span><span style={{ color: '#f87171' }}>— {discountAmt} ج.م</span>
                    </div>}
                    {taxAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>ضريبة</span><span style={{ color: '#fbbf24' }}>+ {taxAmt} ج.م</span>
                    </div>}
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800' }}>
                      <span>الإجمالي</span>
                      <span style={{ color: '#34d399' }}>{total.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={savePurchase} style={{ flex: 1, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '16px' }}>💾 حفظ فاتورة الشراء</button>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '16px' }}>إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}