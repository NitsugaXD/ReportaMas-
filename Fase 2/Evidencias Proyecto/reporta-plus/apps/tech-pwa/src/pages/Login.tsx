import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/auth'

export default function Login(){
  const nav = useNavigate()
  const login = useAuth(s=>s.login)
  const loadMe = useAuth(s=>s.loadMe)
  const user = useAuth(s=>s.user)
  const [email, setEmail] = useState('admin@reporta.plus')
  const [password, setPassword] = useState('admin123')
  const [err, setErr] = useState('')
  useEffect(()=>{ loadMe() },[])
  useEffect(()=>{ if(user) nav('/') },[user])

  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setErr('')
    try { await login(email,password); nav('/') } catch(e:any){ setErr(e.message||'Error') }
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
        <h1 className="text-xl font-semibold mb-4">Reporta+ — Técnicos</h1>
        <input className="border rounded w-full p-2 mb-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
        <input className="border rounded w-full p-2 mb-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña"/>
        {err && <p className="text-red-600 text-sm mb-2">{err}</p>}
        <button className="w-full py-2 rounded bg-black text-white">Entrar</button>
      </form>
    </div>
  )
}