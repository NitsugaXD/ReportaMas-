import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Card from '../components/Card'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import { PencilSimple, Trash, ArrowClockwise } from 'phosphor-react'
import { showToast } from '../components/Toast'

export default function ServicesList() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/services', { params: { page:1, pageSize:200, q }})
      setItems(data.items || data)
    } catch (e) { console.error(e); showToast('Error cargando servicios','error') } finally { setLoading(false) }
  }

  async function onDelete(s:any) {
    if (!confirm('¿Eliminar servicio?')) return
    try { await api.delete(`/services/${s.id}`); showToast('Servicio eliminado','success'); load() } catch(e:any){ console.error(e); showToast(e?.response?.data?.message || 'Error eliminando','error') }
  }

  async function resend(s:any) {
    try { await api.post(`/services/${s.id}/resend`); showToast('Reenviado','success') } catch(e:any){ console.error(e); showToast(e?.response?.data?.message || 'Error reenviando','error') }
  }

  return (
    <AppLayout>
      <div className="header">
        <div>
          <div className="brand">Servicios</div>
          <div className="small">Listado y acciones</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link to="/services/new" className="btn">+ Nuevo</Link>
          <input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} className="input" />
          <button className="btn secondary" onClick={load}>Buscar</button>
        </div>
      </div>

      <Card>
        <table className="table">
          <thead><tr><th>Referencia</th><th>Cliente</th><th>Técnico</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {items.map(s=>(
              <tr key={s.id}>
                <td>{s.client?.name ?? s.type ?? '—'}</td> {/* humano, no UID */}
                <td>{s.client?.name}</td>
                <td>{s.tech?.name}</td>
                <td>{s.date ? new Date(s.date).toLocaleString() : ''}</td>
                <td>{translateStatus(s.status)}</td>
                <td>
                  <Link to={`/services/${s.id}`} className="btn secondary" title="Ver">Ver</Link>
                  <Link to={`/services/${s.id}/edit`} className="btn secondary" style={{ marginLeft:8 }} title="Editar"><Icon C={PencilSimple} size={14} /></Link>
                  <button className="btn" style={{ marginLeft:8 }} onClick={()=>onDelete(s)} title="Eliminar"><Icon C={Trash} size={14} /></button>
                  <button className="btn secondary" style={{ marginLeft:8 }} onClick={()=>resend(s)} title="Reenviar"><Icon C={ArrowClockwise} size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppLayout>
  )
}

function translateStatus(s?: string) {
  if (!s) return 'Desconocido'
  const map: Record<string,string> = {
    PENDING: 'Pendiente',
    SIGNED: 'Firmado',
    SENT: 'Enviado',
    SAVED_OFFLINE: 'Guardado (offline)',
    PENDING_SEND: 'Pendiente de envío',
    CLOSED: 'Cerrado',
    DRAFT: 'Borrador'
  }
  return map[s] ?? s
}