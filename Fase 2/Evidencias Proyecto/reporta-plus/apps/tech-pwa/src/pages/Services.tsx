import { useEffect, useState } from 'react'
import api from '../api/client'
import { Link } from 'react-router-dom'
import { useAuth } from '../stores/auth'

type Item = { id:string; serviceUid:string; type:string; status:string; date:string; client?:{name:string}; site?:{name?:string; address?:string} }

export default function Services(){
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState('')
  const logout = useAuth(s=>s.logout)

  async function load(){
    const { data } = await api.get('/services', { params:{ q, page:1, pageSize:20 } })
    setItems(data.items)
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <header className="flex items-center gap-2 mb-4">
        <input className="border rounded p-2 flex-1" placeholder="Buscar por texto/UID..." value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={load} className="px-3 py-2 rounded bg-black text-white">Buscar</button>
        <Link to="/new" className="px-3 py-2 rounded bg-emerald-600 text-white">Nuevo</Link>
        <button onClick={logout} className="px-3 py-2 rounded bg-gray-200">Salir</button>
      </header>

      <ul className="space-y-2">
        {items.map(s=>(
          <li key={s.id} className="border rounded p-3 flex justify-between gap-2">
            <div>
              <div className="font-medium">{s.type} • {s.status}</div>
              <div className="text-sm text-gray-600">{new Date(s.date).toLocaleString()} — {s.client?.name} {s.site?.name ? `· ${s.site.name}` : ''}</div>
              <div className="text-xs text-gray-500">UID: {s.serviceUid}</div>
            </div>
            <Link to={`/s/${s.id}`} className="text-sm underline">Ver</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}