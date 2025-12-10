import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import Card from '../components/Card'
import AppLayout from '../components/AppLayout'
import { showToast } from '../components/Toast'

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>()
  const [svc, setSvc] = useState<any|null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const nav = useNavigate()

  useEffect(()=>{ if(id) load() },[id])

  async function load() {
    setLoading(true)
    try { const { data } = await api.get(`/services/${id}`); setSvc(data) } catch (e:any) { console.error(e); showToast('Error cargando servicio', 'error') } finally { setLoading(false) }
  }

  async function save(e?:any) {
    e?.preventDefault()
    if (!svc) return
    setSaving(true)
    try {
      const payload: any = {
        type: svc.type,
        notes: svc.notes,
        techId: svc.tech?.id ?? svc.techId,
        clientId: svc.client?.id ?? svc.clientId,
        status: svc.status
      }
      await api.patch(`/services/${svc.id}`, payload)
      showToast('Servicio actualizado', 'success')
      nav(`/services/${svc.id}`)
    } catch (err:any) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Error guardando', 'error')
    } finally { setSaving(false) }
  }

  if (loading) return <AppLayout><div className="small">Cargando...</div></AppLayout>
  if (!svc) return <AppLayout><div>No encontrado</div></AppLayout>

  return (
    <AppLayout>
      <div className="header">
        <div>
          <div className="brand">Editar: {svc.serviceUid ?? ''}</div>
          <div className="small">Modifica los campos y guarda</div>
        </div>
      </div>

      <Card>
        <form onSubmit={save} style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
          <div>
            <div style={{ marginBottom:8 }}>
              <label className="small">Notas</label>
              <textarea className="input" value={svc.notes || ''} onChange={e=>setSvc({...svc, notes: e.target.value})} style={{ minHeight:120 }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label className="small">Tipo</label>
                <input className="input" value={svc.type || ''} onChange={e=>setSvc({...svc, type: e.target.value})} />
              </div>

              <div>
                <label className="small">Estado</label>
                <select className="input" value={svc.status || ''} onChange={e=>setSvc({...svc, status: e.target.value})}>
                  <option value="PENDING">PENDING</option>
                  <option value="SIGNED">SIGNED</option>
                  <option value="SENT">SENT</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div style={{ marginBottom:8 }}>
              <label className="small">Cliente (ID)</label>
              <input className="input" value={svc.client?.id ?? svc.clientId ?? ''} onChange={e=>setSvc({...svc, clientId: e.target.value})} />
            </div>

            <div style={{ marginBottom:8 }}>
              <label className="small">Técnico (ID)</label>
              <input className="input" value={svc.tech?.id ?? svc.techId ?? ''} onChange={e=>setSvc({...svc, techId: e.target.value})} />
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
              <button type="button" className="btn secondary" onClick={()=>nav(`/services/${svc.id}`)}>Cancelar</button>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </form>
      </Card>
    </AppLayout>
  )
}