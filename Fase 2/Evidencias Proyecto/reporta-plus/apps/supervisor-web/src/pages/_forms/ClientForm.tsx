import { useEffect, useState } from 'react'
import api from '../../api/client'

type Props = { client?: any|null; onSaved: ()=>void; onCancel: ()=>void }

export default function ClientForm({ client, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({ name:'', email:'', phone:'' })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(()=> { if (client) setForm({ name: client.name || '', email: client.email || '', phone: client.phone || '' }) }, [client])

  function validate() {
    const e: Record<string,string> = {}
    if (!form.name) e.name = 'Nombre es requerido'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e?:any) {
    e?.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      if (client) {
        await api.patch(`/clients/${client.id}`, form)
      } else {
        await api.post('/clients', form)
      }
      onSaved()
    } catch (err:any) {
      alert(err?.response?.data?.message || 'Error guardando')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <input className="input" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        {errors.name && <div style={{ color:'#a11', fontSize:13 }}>{errors.name}</div>}
      </div>
      <div>
        <input className="input" placeholder="Correo" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        {errors.email && <div style={{ color:'#a11', fontSize:13 }}>{errors.email}</div>}
      </div>
      <div>
        <input className="input" placeholder="Teléfono" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
      </div>

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  )
}