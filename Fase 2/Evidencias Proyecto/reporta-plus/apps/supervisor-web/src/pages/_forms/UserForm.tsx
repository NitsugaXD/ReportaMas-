import { useEffect, useState } from 'react'
import api from '../../api/client'

type Props = { user?: any|null; onSaved: ()=>void; onCancel: ()=>void }

export default function UserForm({ user, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({ email:'', name:'', role:'TECH', password:'', active:true })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(()=> {
    if (user) setForm({ email: user.email || '', name: user.name || '', role: user.role || 'TECH', password: '', active: user.active ?? true })
  }, [user])

  function validate() {
    const e: Record<string,string> = {}
    if (!user && !form.email) e.email = 'Email es requerido'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    if (!form.name) e.name = 'Nombre es requerido'
    if (!user && !form.password) e.password = 'Contraseña es requerida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e?:any) {
    e?.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      if (user) {
        const body:any = { name: form.name, role: form.role, active: form.active }
        if (form.password) body.password = form.password
        await api.patch(`/users/${user.id}`, body)
      } else {
        await api.post('/users', { email: form.email, name: form.name, role: form.role, password: form.password })
      }
      onSaved()
    } catch (err:any) {
      alert(err?.response?.data?.message || 'Error guardando')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!user && (
        <div>
          <input className="input" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          {errors.email && <div style={{ color:'#a11', fontSize:13 }}>{errors.email}</div>}
        </div>
      )}
      <div>
        <input className="input" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        {errors.name && <div style={{ color:'#a11', fontSize:13 }}>{errors.name}</div>}
      </div>

      <div>
        <select className="input" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
          <option value="TECH">TECH</option>
          <option value="SUP">SUP</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      <div>
        <input className="input" placeholder="Contraseña (solo si crea o cambia)" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        {errors.password && <div style={{ color:'#a11', fontSize:13 }}>{errors.password}</div>}
      </div>

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  )
}