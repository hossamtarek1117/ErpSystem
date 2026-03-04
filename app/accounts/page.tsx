'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

type Account = {
  id: string
  account_code: string
  account_name: string
  account_type: string
  parent_id: string | null
  level: number
  is_group: boolean
  allow_transactions: boolean
  currency: string
  is_active: boolean
  debit: number
  credit: number
  balance: number
  nature: string
  description: string
  children?: Account[]
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [tree, setTree] = useState<Account[]>([])
  const [showModal, setShowModal] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Account | null>(null)
  const [form, setForm] = useState({
    account_code: '', account_name: '', account_type: 'Asset', parent_id: '',
    is_group: false, allow_transactions: true, currency: 'EGP', nature: 'Debit', description: ''
  })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await db.from('accounts').select('*').order('account_code')
    const all = data || []
    setAccounts(all)
    setTree(buildTree(all, null))
    const roots = all.filter((a: Account) => !a.parent_id)
    setExpanded(new Set(roots.map((r: Account) => r.id)))
  }

  function buildTree(all: Account[], parentId: string | null): Account[] {
    return all
      .filter(a => a.parent_id === parentId)
      .map(a => ({ ...a, children: buildTree(all, a.id) }))
  }

  async function save() {
    if (!form.account_code) return alert('اكتب كود الحساب')
    if (!form.account_name) return alert('اكتب اسم الحساب')
    const parent = accounts.find(a => a.id === form.parent_id)
    const level = parent ? parent.level + 1 : 1
    const nature = ['Asset', 'Expense'].includes(form.account_type) ? 'Debit' : 'Credit'
    await db.from('accounts').insert({
      ...form, parent_id: form.parent_id || null, level,
      allow_transactions: !form.is_group, nature
    })
    setShowModal(false)
    setForm({ account_code: '', account_name: '', account_type: 'Asset', parent_id: '', is_group: false, allow_transactions: true, currency: 'EGP', nature: 'Debit', description: '' })
    load()
  }

  async function toggleActive(acc: Account) {
    await db.from('accounts').update({ is_active: !acc.is_active }).eq('id', acc.id)
    load()
  }

  function toggleExpand(id: string) {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  const typeColor: Record<string, { bg: string; color: string }> = {
    'Asset': { bg: '#dbeafe', color: '#2563eb' },
    'Liability': { bg: '#fee2e2', color: '#dc2626' },
    'Equity': { bg: '#f3e8ff', color: '#9333ea' },
    'Revenue': { bg: '#dcfce7', color: '#16a34a' },
    'Expense': { bg: '#fef9c3', color: '#ca8a04' },
  }

  const typeLabel: Record<string, string> = {
    'Asset': 'أصول', 'Liability': 'خصوم', 'Equity': 'حقوق ملكية', 'Revenue': 'إيرادات', 'Expense': 'مصروفات'
  }

  function renderTree(nodes: Account[], depth = 0): React.ReactElement[] {
    const filtered = search ? accounts.filter(a => a.account_name.includes(search) || a.account_code.includes(search)) : null
    const toRender = filtered || nodes

    return toRender.flatMap(acc => {
      const hasChildren = acc.children && acc.children.length > 0
      const isExpanded = expanded.has(acc.id)
      const isSelected = selected?.id === acc.id

      return [
        <div key={acc.id} onClick={() => setSelected(acc)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', marginRight: `${depth * 24}px`, borderRadius: '10px', cursor: 'pointer', marginBottom: '4px', background: isSelected ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : '#f8fafc', border: '1px solid ' + (isSelected ? 'transparent' : '#e2e8f0') }}>
          {hasChildren && !filtered ? (
            <span onClick={e => { e.stopPropagation(); toggleExpand(acc.id) }}
              style={{ cursor: 'pointer', fontSize: '12px', color: isSelected ? '#fff' : '#64748b', width: '16px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : <span style={{ width: '16px' }} />}
          <span style={{ fontWeight: '700', fontSize: '13px', color: isSelected ? '#fff' : '#6366f1', minWidth: '55px' }}>{acc.account_code}</span>
          <span style={{ flex: 1, fontSize: '14px', fontWeight: acc.is_group ? '800' : '500', color: isSelected ? '#fff' : '#0f172a' }}>{acc.account_name}</span>
          <span style={{ fontSize: '12px', color: isSelected ? '#cbd5e1' : '#94a3b8', minWidth: '60px', textAlign: 'center' }}>{acc.nature === 'Debit' ? 'مدين' : 'دائن'}</span>
          <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: isSelected ? 'rgba(255,255,255,0.2)' : typeColor[acc.account_type]?.bg, color: isSelected ? '#fff' : typeColor[acc.account_type]?.color }}>{typeLabel[acc.account_type]}</span>
          {acc.is_group && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: isSelected ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: isSelected ? '#fff' : '#64748b' }}>مجموعة</span>}
          {!acc.is_active && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: '#fee2e2', color: '#dc2626' }}>معطل</span>}
        </div>,
        ...(hasChildren && isExpanded && !filtered ? renderTree(acc.children!, depth + 1) : [])
      ]
    })
  }

  return (
    <div style={{ display: 'flex', direction: 'rtl' }}>
      <Sidebar />
      <div style={{ marginRight: '240px', padding: '32px', background: '#f1f5f9', minHeight: '100vh', flex: 1, fontFamily: 'Tajawal,sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>دليل الحسابات 📊</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Chart of Accounts — أساس النظام المحاسبي</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 15px rgba(99,102,241,.3)' }}>
            + إضافة حساب
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '24px' }}>
          {Object.entries(typeLabel).map(([type, label]) => (
            <div key={type} style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', background: typeColor[type]?.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '16px' }}>
                {type === 'Asset' ? '🏦' : type === 'Liability' ? '💳' : type === 'Equity' ? '👑' : type === 'Revenue' ? '💰' : '🧾'}
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>{label}</p>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: typeColor[type]?.color }}>{accounts.filter(a => a.account_type === type).length}</h3>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Tree */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو الكود..."
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />
            <div>{renderTree(tree)}</div>
            {accounts.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>لا توجد حسابات بعد 📊</p>}
          </div>

          {/* Details */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', height: 'fit-content' }}>
            {selected ? (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px' }}>تفاصيل الحساب</h3>

                {/* الأرصدة */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'مدين', value: Number(selected.debit || 0).toLocaleString(), color: '#2563eb' },
                    { label: 'دائن', value: Number(selected.credit || 0).toLocaleString(), color: '#dc2626' },
                    { label: 'الرصيد', value: Number(selected.balance || 0).toLocaleString(), color: '#16a34a' },
                  ].map((r, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>{r.label}</p>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: r.color }}>{r.value}</h4>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'الكود', value: selected.account_code },
                    { label: 'الاسم', value: selected.account_name },
                    { label: 'النوع', value: typeLabel[selected.account_type] },
                    { label: 'الطبيعة', value: selected.nature === 'Debit' ? 'مدين' : 'دائن' },
                    { label: 'المستوى', value: 'مستوى ' + selected.level },
                    { label: 'العملة', value: selected.currency },
                    { label: 'النوع', value: selected.is_group ? '📁 مجموعة' : '📄 حساب فعلي' },
                    { label: 'التسجيل', value: selected.allow_transactions ? '✅ مسموح' : '❌ غير مسموح' },
                    { label: 'الحالة', value: selected.is_active ? '✅ نشط' : '🔴 معطل' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>{r.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{r.value}</span>
                    </div>
                  ))}
                  {selected.description && (
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', marginTop: '4px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>الوصف</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#0f172a' }}>{selected.description}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => { setForm({ account_code: '', account_name: '', account_type: selected.account_type, parent_id: selected.id, is_group: false, allow_transactions: true, currency: 'EGP', nature: 'Debit', description: '' }); setShowModal(true) }}
                      style={{ flex: 1, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '13px' }}>+ فرعي</button>
                    <button onClick={() => toggleActive(selected)}
                      style={{ flex: 1, background: selected.is_active ? '#fee2e2' : '#dcfce7', color: selected.is_active ? '#dc2626' : '#16a34a', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: '700', fontSize: '13px' }}>
                      {selected.is_active ? '🔴 تعطيل' : '✅ تفعيل'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                <p style={{ fontSize: '14px' }}>اضغط على حساب عشان تشوف تفاصيله</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>📊 إضافة حساب جديد</h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>كود الحساب *</label>
                    <input value={form.account_code} onChange={e => setForm({ ...form, account_code: e.target.value })} placeholder="1001"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>العملة</label>
                    <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                      <option value="EGP">جنيه مصري</option>
                      <option value="USD">دولار أمريكي</option>
                      <option value="EUR">يورو</option>
                      <option value="SAR">ريال سعودي</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>اسم الحساب *</label>
                  <input value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} placeholder="مثال: الخزينة الرئيسية"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الوصف</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="وصف مختصر للحساب"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>نوع الحساب</label>
                  <select value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value, nature: ['Asset', 'Expense'].includes(e.target.value) ? 'Debit' : 'Credit' })}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                    <option value="Asset">🏦 أصول</option>
                    <option value="Liability">💳 خصوم</option>
                    <option value="Equity">👑 حقوق ملكية</option>
                    <option value="Revenue">💰 إيرادات</option>
                    <option value="Expense">🧾 مصروفات</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' }}>الحساب الأب</label>
                  <select value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: 'Tajawal,sans-serif', fontSize: '14px', outline: 'none' }}>
                    <option value="">— حساب رئيسي —</option>
                    {accounts.filter(a => a.is_group).map(a => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                  <input type="checkbox" id="isGroup" checked={form.is_group} onChange={e => setForm({ ...form, is_group: e.target.checked, allow_transactions: !e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="isGroup" style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#0f172a' }}>📁 مجموعة حسابات (لا تقبل قيود مباشرة)</label>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>طبيعة الحساب (تلقائي)</p>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', background: ['Asset', 'Expense'].includes(form.account_type) ? '#dbeafe' : '#dcfce7', color: ['Asset', 'Expense'].includes(form.account_type) ? '#2563eb' : '#16a34a' }}>
                    {['Asset', 'Expense'].includes(form.account_type) ? 'مدين (Debit)' : 'دائن (Credit)'}
                  </span>
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
