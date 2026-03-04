'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

type Client = {
  id: string
  name: string
  phone: string
  email: string
  city: string
  client_code: string
  balance: number
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Client|null>(null)
  const [form, setForm] = useState({name:'',phone:'',email:'',city:''})

  useEffect(()=>{load()},[])

  async function load(){
    const{data}=await db.from('clients').select('*').order('created_at',{ascending:false})
    setClients(data||[])
  }

  async function save(){
    if(!form.name)return alert('اكتب اسم العميل')
    if(form.phone.length>0 && form.phone.length!==11)return alert('رقم التليفون لازم يكون 11 رقم')
    if(editing){
      await db.from('clients').update(form).eq('id',editing.id)
    } else {
      await db.from('clients').insert({...form,client_code:'CLT-'+Date.now().toString().slice(-5)})
    }
    setShowModal(false)
    setEditing(null)
    setForm({name:'',phone:'',email:'',city:''})
    load()
  }

  async function del(id:string){
    if(!confirm('حذف العميل؟'))return
    await db.from('clients').delete().eq('id',id)
    load()
  }

  function edit(c:Client){
    setEditing(c)
    setForm({name:c.name,phone:c.phone||'',email:c.email||'',city:c.city||''})
    setShowModal(true)
  }

  const inp = {padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontFamily:'Tajawal,sans-serif',fontSize:'14px',outline:'none',width:'100%'} as React.CSSProperties

  return (
    <div style={{display:'flex',direction:'rtl'}}>
      <Sidebar/>
      <div style={{marginRight:'240px',padding:'32px',background:'#f1f5f9',minHeight:'100vh',flex:1,fontFamily:'Tajawal,sans-serif'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
          <h1 style={{fontSize:'24px',fontWeight:'800',color:'#0f172a'}}>العملاء 🤝</h1>
          <button onClick={()=>{setEditing(null);setForm({name:'',phone:'',email:'',city:''});setShowModal(true)}}
            style={{background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',border:'none',padding:'10px 20px',borderRadius:'12px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'700',fontSize:'14px'}}>
            + إضافة عميل
          </button>
        </div>

        <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['الكود','الاسم','الهاتف','البريد','المدينة','الرصيد','إجراءات'].map(h=>(
                  <th key={h} style={{background:'#f8fafc',padding:'10px 14px',textAlign:'right',fontSize:'12px',color:'#64748b',fontWeight:'700'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c=>(
                <tr key={c.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                  <td style={{padding:'10px 14px',fontWeight:'700',color:'#6366f1'}}>{c.client_code||'-'}</td>
                  <td style={{padding:'10px 14px',fontWeight:'700'}}>{c.name}</td>
                  <td style={{padding:'10px 14px',fontSize:'13px'}}>{c.phone||'-'}</td>
                  <td style={{padding:'10px 14px',fontSize:'13px'}}>{c.email||'-'}</td>
                  <td style={{padding:'10px 14px',fontSize:'13px'}}>{c.city||'-'}</td>
                  <td style={{padding:'10px 14px',fontSize:'13px',fontWeight:'700',color:Number(c.balance)>0?'#16a34a':'#64748b'}}>{c.balance||0} ج.م</td>
                  <td style={{padding:'10px 14px'}}>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>edit(c)} style={{background:'#dbeafe',color:'#2563eb',border:'none',padding:'6px 12px',borderRadius:'8px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'600',fontSize:'13px'}}>✏️</button>
                      <button onClick={()=>del(c.id)} style={{background:'#fee2e2',color:'#dc2626',border:'none',padding:'6px 12px',borderRadius:'8px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'600',fontSize:'13px'}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length===0&&<tr><td colSpan={7} style={{textAlign:'center',color:'#94a3b8',padding:'40px'}}>لا يوجد عملاء</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setShowModal(false)}>
            <div style={{background:'#fff',borderRadius:'20px',padding:'28px',width:'90%',maxWidth:'480px'}} onClick={e=>e.stopPropagation()}>
              <h3 style={{fontSize:'18px',fontWeight:'800',marginBottom:'20px',color:'#0f172a'}}>{editing?'تعديل عميل':'إضافة عميل'}</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div>
                  <label style={{fontSize:'13px',color:'#64748b',marginBottom:'4px',display:'block'}}>اسم العميل *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="اكتب اسم العميل" style={inp}/>
                </div>
                <div>
                  <label style={{fontSize:'13px',color:'#64748b',marginBottom:'4px',display:'block'}}>رقم الهاتف (11 رقم)</label>
                  <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,'').slice(0,11)})} placeholder="01xxxxxxxxx" style={inp} maxLength={11}/>
                  {form.phone.length>0&&<p style={{fontSize:'11px',color:form.phone.length===11?'#16a34a':'#f59e0b',marginTop:'4px'}}>{form.phone.length}/11 رقم</p>}
                </div>
                <div>
                  <label style={{fontSize:'13px',color:'#64748b',marginBottom:'4px',display:'block'}}>البريد الإلكتروني</label>
                  <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="example@email.com" style={inp}/>
                </div>
                <div>
                  <label style={{fontSize:'13px',color:'#64748b',marginBottom:'4px',display:'block'}}>المدينة</label>
                  <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="القاهرة" style={inp}/>
                </div>
                <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
                  <button onClick={save} style={{flex:1,background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',border:'none',padding:'12px',borderRadius:'12px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'700',fontSize:'15px'}}>حفظ</button>
                  <button onClick={()=>setShowModal(false)} style={{flex:1,background:'#f1f5f9',border:'none',padding:'12px',borderRadius:'12px',cursor:'pointer',fontFamily:'Tajawal,sans-serif',fontWeight:'700',fontSize:'15px'}}>إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
