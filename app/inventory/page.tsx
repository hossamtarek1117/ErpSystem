'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

type Product = {
  id: string
  name: string
  category: string
  quantity: number
  min_quantity: number
  cost_price: number
  sell_price: number
  barcode: string
  status: string
}
export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product|null>(null)
  const [form, setForm] = useState({name:'',category:'',quantity:0,min_quantity:5,cost_price:0,sell_price:0,barcode:'',status:'متاح'})

  useEffect(()=>{load()},[])

  async function load(){
    const{data}=await db.from('inventory').select('*').order('created_at',{ascending:false})
    setProducts(data||[])
  }

  async function save(){
    if(!form.name)return alert('اكتب اسم المنتج')
    if(editing){
      await db.from('inventory').update(form).eq('id',editing.id)
    } else {
      await db.from('inventory').insert(form)
    }
    setShowModal(false)
    setEditing(null)
    setForm({name:'',category:'',quantity:0,min_quantity:5,cost_price:0,sell_price:0,barcode:'',status:'متاح'})
    load()
  }

  async function del(id:string){
    if(!confirm('حذف المنتج؟'))return
    await db.from('inventory').delete().eq('id',id)
    load()
  }

  function edit(p:Product){
    setEditing(p)
    setForm({name:p.name,category:p.category,quantity:p.quantity,min_quantity:p.min_quantity,cost_price:p.cost_price,sell_price:p.sell_price,barcode:p.barcode,status:p.status})
    setShowModal(true)
  }

  const inp = {padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontFamily:'Tajawal,sans-serif',fontSize:'14px',outline:'none',width:'100%'} as React.CSSProperties
  const label = {fontSize:'13px',color:'#64748b',marginBottom:'4px',display:'block'} as React.CSSProperties

  return (
    <div style={{display:'flex',direction:'rtl'}}>
      <Sidebar/>
      <div style={{marginRight:'240px',padding:'32px',background:'#f1f5f9',minHeight:'100vh',flex:1,fontFamily:'Tajawal,sans-serif'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
          <h1 style={{fontSize:'24px',fontWeight:'800',color:'#0f172a'}}>المنتجات والمخزون 📦</h1>
          <button onClick={()=>{setEditing(null);setForm({name:'',category:'',quantity:0,min_quantity:5,cost_price:0,sell_price:0,barcode:'',status:'متاح'});setShowModal(true)}}
            style={{background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',border:'none',padding:'10px 20px',borderRadius:'12px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'700',fontSize:'14px'}}>
            + إضافة منتج
          </button>
        </div>

        <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['المنتج','الفئة','الكمية','الحد الأدنى','سعر الشراء','سعر البيع','الباركود','الحالة','إجراءات'].map(h=>(
                  <th key={h} style={{background:'#f8fafc',padding:'10px 14px',textAlign:'right',fontSize:'12px',color:'#64748b',fontWeight:'700'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p=>(
                <tr key={p.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                  <td style={{padding:'10px 14px',fontWeight:'700'}}>{p.name}</td>
                  <td style={{padding:'10px 14px',fontSize:'13px'}}>{p.category||'-'}</td>
                  <td style={{padding:'10px 14px',fontWeight:'700',color:p.quantity<=(p.min_quantity||5)?'#dc2626':'#16a34a'}}>{p.quantity}</td>
                  <td style={{padding:'10px 14px',fontSize:'13px'}}>{p.min_quantity||5}</td>
                  <td style={{padding:'10px 14px',fontSize:'13px'}}>{p.cost_price||0} ج.م</td>
                  <td style={{padding:'10px 14px',fontSize:'13px'}}>{p.sell_price||0} ج.م</td>
                  <td style={{padding:'10px 14px',fontSize:'12px',color:'#64748b'}}>{p.barcode||'-'}</td>
                  <td style={{padding:'10px 14px'}}>
                    <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',background:p.status==='متاح'?'#dcfce7':p.status==='نفذ'?'#fee2e2':'#fef9c3',color:p.status==='متاح'?'#16a34a':p.status==='نفذ'?'#dc2626':'#ca8a04'}}>{p.status}</span>
                  </td>
                  <td style={{padding:'10px 14px'}}>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>edit(p)} style={{background:'#dbeafe',color:'#2563eb',border:'none',padding:'6px 12px',borderRadius:'8px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'600',fontSize:'13px'}}>✏️</button>
                      <button onClick={()=>del(p.id)} style={{background:'#fee2e2',color:'#dc2626',border:'none',padding:'6px 12px',borderRadius:'8px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'600',fontSize:'13px'}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length===0&&<tr><td colSpan={9} style={{textAlign:'center',color:'#94a3b8',padding:'40px'}}>لا توجد منتجات</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setShowModal(false)}>
            <div style={{background:'#fff',borderRadius:'20px',padding:'28px',width:'90%',maxWidth:'480px',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
              <h3 style={{fontSize:'18px',fontWeight:'800',marginBottom:'20px',color:'#0f172a'}}>{editing?'تعديل منتج':'إضافة منتج'}</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div>
                  <label style={label}>اسم المنتج *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثال: دettol مطهر" style={inp}/>
                </div>
                <div>
                  <label style={label}>الفئة</label>
                  <input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="مثال: مطهرات، إلكترونيات" style={inp}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <div>
                    <label style={label}>الكمية الحالية</label>
                    <input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:Number(e.target.value)})} placeholder="0" style={inp}/>
                  </div>
                  <div>
                    <label style={label}>الحد الأدنى للتنبيه</label>
                    <input type="number" value={form.min_quantity} onChange={e=>setForm({...form,min_quantity:Number(e.target.value)})} placeholder="5" style={inp}/>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <div>
                    <label style={label}>سعر الشراء (ج.م)</label>
                    <input type="number" value={form.cost_price} onChange={e=>setForm({...form,cost_price:Number(e.target.value)})} placeholder="0" style={inp}/>
                  </div>
                  <div>
                    <label style={label}>سعر البيع (ج.م)</label>
                    <input type="number" value={form.sell_price} onChange={e=>setForm({...form,sell_price:Number(e.target.value)})} placeholder="0" style={inp}/>
                  </div>
                </div>
                {form.cost_price>0&&form.sell_price>0&&(
                  <div style={{background:'#f0fdf4',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#16a34a',fontWeight:'700'}}>
                    💰 هامش الربح: {((form.sell_price-form.cost_price)/form.cost_price*100).toFixed(1)}% | ربح القطعة: {(form.sell_price-form.cost_price).toFixed(2)} ج.م
                  </div>
                )}
                <div>
                  <label style={label}>الباركود (اختياري)</label>
                  <input value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} placeholder="امسح أو اكتب الباركود" style={inp}/>
                </div>
                <div>
                  <label style={label}>الحالة</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inp}>
                    <option value="متاح">متاح</option>
                    <option value="محدود">محدود</option>
                    <option value="نفذ">نفذ</option>
                  </select>
                </div>
                <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
                  <button onClick={save} style={{flex:1,background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',border:'none',padding:'12px',borderRadius:'12px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'700',fontSize:'15px'}}>حفظ</button>
                  <button onClick={()=>setShowModal(false)} style={{flex:1,background:'#f1f5f9',border:'none',padding:'12px',borderRadius:'12px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'700',fontSize:'15px'}}>إلغاء</button>
                </div>
              </div>
            </div>
          </div>
          // koko
        )}
      </div>
    </div>
  )
}
