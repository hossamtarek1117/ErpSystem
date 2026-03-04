'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/supabase.ts'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
  const [stats, setStats] = useState({sales:0, products:0, employees:0, clients:0, profits:0, expenses:0})

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [{data:sales},{data:inv},{data:emp},{data:cli},{data:exp},{data:prof}] = await Promise.all([
      db.from('sales').select('total'),
      db.from('inventory').select('id'),
      db.from('employees').select('id'),
      db.from('clients').select('id'),
      db.from('expenses').select('amount'),
      db.from('profits').select('profit_after_tax')
    ])
    setStats({
      sales: (sales||[]).reduce((a,s)=>a+Number(s.total||0),0),
      products: (inv||[]).length,
      employees: (emp||[]).length,
      clients: (cli||[]).length,
      expenses: (exp||[]).reduce((a,e)=>a+Number(e.amount||0),0),
      profits: (prof||[]).reduce((a,p)=>a+Number(p.profit_after_tax||0),0),
    })
  }

  return (
    <div style={{display:'flex',direction:'rtl'}}>
      <Sidebar/>
      <div style={{marginRight:'240px',padding:'32px',background:'#f1f5f9',minHeight:'100vh',flex:1,fontFamily:'Tajawal,sans-serif'}}>
        <h1 style={{fontSize:'24px',fontWeight:'800',color:'#0f172a',marginBottom:'24px'}}>لوحة التحكم 📊</h1>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'16px'}}>
          {[
            {label:'إجمالي المبيعات',value:stats.sales.toFixed(0)+' ج.م',color:'#3b82f6',icon:'💰'},
            {label:'إجمالي الأرباح',value:stats.profits.toFixed(0)+' ج.م',color:'#10b981',icon:'📈'},
            {label:'المنتجات',value:stats.products,color:'#f59e0b',icon:'📦'},
            {label:'الموظفين',value:stats.employees,color:'#ec4899',icon:'👥'},
            {label:'العملاء',value:stats.clients,color:'#8b5cf6',icon:'🤝'},
            {label:'المصروفات',value:stats.expenses.toFixed(0)+' ج.م',color:'#ef4444',icon:'🧾'},
          ].map((s,i)=>(
            <div key={i} style={{background:`linear-gradient(135deg,${s.color},${s.color}cc)`,borderRadius:'16px',padding:'20px',color:'#fff'}}>
              <div style={{fontSize:'28px',marginBottom:'8px'}}>{s.icon}</div>
              <p style={{fontSize:'12px',opacity:.8,marginBottom:'4px'}}>{s.label}</p>
              <h3 style={{fontSize:'22px',fontWeight:'800'}}>{s.value}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}