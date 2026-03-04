'use client'
import { useState } from 'react'
import { db } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const router = useRouter()

  async function login() {
    const { data } = await db.from('users').select('*').eq('username', user).eq('password', pass).single()
    if (data) {
      localStorage.setItem('nexus_user', JSON.stringify(data))
      router.push('/dashboard')
    } else {
      setErr('بيانات غلط!')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#0f172a,#1e3a5f)'}}>
      <div style={{background:'rgba(255,255,255,0.07)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px',padding:'44px',width:'90%',maxWidth:'400px',textAlign:'center'}}>
        <div style={{width:'64px',height:'64px',background:'linear-gradient(135deg,#3b82f6,#6366f1)',borderRadius:'18px',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:'20px',fontSize:'28px'}}>🚀</div>
        <h1 style={{color:'#fff',fontSize:'28px',fontWeight:'800',marginBottom:'4px'}}>NEXUS <span style={{color:'#60a5fa'}}>PRO</span></h1>
        <p style={{color:'#93c5fd',marginBottom:'32px',fontSize:'14px'}}>نظام الإدارة الذكي للشركات</p>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <input value={user} onChange={e=>setUser(e.target.value)} placeholder="اسم المستخدم" style={{width:'100%',padding:'12px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.08)',border:'1.5px solid rgba(255,255,255,0.1)',color:'#fff',fontFamily:'inherit',fontSize:'15px',outline:'none',direction:'rtl'}}/>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="كلمة المرور" onKeyDown={e=>e.key==='Enter'&&login()} style={{width:'100%',padding:'12px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.08)',border:'1.5px solid rgba(255,255,255,0.1)',color:'#fff',fontFamily:'inherit',fontSize:'15px',outline:'none',direction:'rtl'}}/>
          {err && <p style={{color:'#f87171',fontSize:'13px'}}>{err}</p>}
          <button onClick={login} style={{background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',border:'none',padding:'13px',borderRadius:'12px',fontFamily:'inherit',fontSize:'16px',fontWeight:'700',cursor:'pointer'}}>دخول المنظومة</button>
        </div>
        <p style={{color:'#475569',fontSize:'12px',marginTop:'16px'}}>admin / admin123</p>
      </div>
    </div>
  )
}