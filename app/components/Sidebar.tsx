'use client'
import { useRouter, usePathname } from 'next/navigation'

const links = [
  {href:'/dashboard', icon:'📊', label:'لوحة التحكم'},
  {href:'/accounts', icon:'📊', label:'دليل الحسابات'},
  {href:'/sales', icon:'💰', label:'المبيعات'},
  {href:'/clients', icon:'🤝', label:'العملاء'},
  {href:'/inventory', icon:'📦', label:'المخزون'},
  {href:'/suppliers', icon:'🚚', label:'الموردين'},
  {href:'/purchases', icon:'🛒', label:'المشتريات'},
  {href:'/employees', icon:'👥', label:'الموظفين'},
  {href:'/attendance', icon:'🕐', label:'الحضور والغياب'},
  {href:'/salaries', icon:'💵', label:'الرواتب'},
  {href:'/expenses', icon:'🧾', label:'المصروفات'},
  {href:'/profits', icon:'📈', label:'تقرير الأرباح'},
  {href:'/activity', icon:'📋', label:'سجل الأنشطة'},
]

export default function Sidebar() {
  const router = useRouter()
  const path = usePathname()

  return (
    <aside style={{width:'240px',background:'#0f172a',minHeight:'100vh',padding:'20px 12px',display:'flex',flexDirection:'column',position:'fixed',top:0,right:0,bottom:0,overflowY:'auto',zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'28px',padding:'0 6px'}}>
        <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#3b82f6,#6366f1)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>🚀</div>
        <span style={{color:'#fff',fontSize:'16px',fontWeight:'800'}}>NEXUS ERP</span>
      </div>
      <nav style={{flex:1,display:'flex',flexDirection:'column',gap:'4px'}}>
        {links.map(l=>(
          <div key={l.href} onClick={()=>router.push(l.href)}
            style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',borderRadius:'10px',cursor:'pointer',transition:'all .2s',
              background:path===l.href?'linear-gradient(135deg,#3b82f6,#6366f1)':'transparent',
              color:path===l.href?'#fff':'#94a3b8',fontSize:'14px'}}>
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </div>
        ))}
      </nav>
      <div style={{borderTop:'1px solid #1e293b',paddingTop:'12px',marginTop:'12px'}}>
        <div onClick={()=>router.push('/')} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',borderRadius:'10px',cursor:'pointer',color:'#ef4444',fontSize:'14px'}}>
          <span>🚪</span><span>تسجيل الخروج</span>
        </div>
      </div>
    </aside>
  )
}
