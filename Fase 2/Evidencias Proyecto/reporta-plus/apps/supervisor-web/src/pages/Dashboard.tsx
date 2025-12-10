import { useEffect, useState } from 'react'
import api from '../api/client'
import Card from '../components/Card'
import Badge from '../components/Badge'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import { ChartPie } from 'phosphor-react'
import { showToast } from '../components/Toast'

type Metrics = {
  totalsByStatus: Record<string, number>
  totalsByTech: Array<{ techId: string | null; count: number; name?: string }>
  lastServices: any[]
  topClients: Array<{ clientId: string | null; count: number; name?: string }>
}

const EMPTY: Metrics = { totalsByStatus: {}, totalsByTech: [], lastServices: [], topClients: [] }

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/dashboard/metrics')
      setMetrics({
        totalsByStatus: data?.totalsByStatus ?? {},
        totalsByTech: data?.totalsByTech ?? [],
        lastServices: data?.lastServices ?? [],
        topClients: data?.topClients ?? [],
      })
    } catch (e:any) {
      console.error(e)
      setMetrics(EMPTY)
      showToast('Error cargando métricas', 'error')
    } finally { setLoading(false) }
  }

  const totals = metrics.totalsByStatus
  const techs = metrics.totalsByTech
  const recent = metrics.lastServices
  const topClients = metrics.topClients

  return (
    <AppLayout>
      <div className="header">
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <Icon C={ChartPie} size={22} />
          <div>
            <div className="brand">Panel de Control</div>
            <div className="small">Resumen de operaciones de servicio</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={load}>{loading ? 'Actualizando...' : 'Actualizar'}</button>
        </div>
      </div>

      <div className="grid stats-grid" style={{ gridTemplateColumns:'repeat(3, 1fr)' }}>
        <Card><div className="small">Pendientes</div><div style={{ fontSize:28, marginTop:8 }}>{totals['PENDING'] ?? 0}</div><div className="small">Esperando asignación</div></Card>
        <Card><div className="small">Enviados</div><div style={{ fontSize:28, marginTop:8 }}>{totals['SENT'] ?? 0}</div><div className="small">Servicios enviados</div></Card>
        <Card><div className="small">Total de Servicios</div><div style={{ fontSize:28, marginTop:8 }}>{Object.values(totals).reduce((a,b)=>a+(b||0),0)}</div><div className="small">Histórico completo</div></Card>
      </div>

      <div className="panels" style={{ marginTop:18 }}>
        <div style={{ flex:1 }}>
          <Card>
            <h4 className="small">Servicios por Técnico</h4>
            <div style={{ marginTop:8 }}>
              {techs.length === 0 ? <div className="small">Sin técnicos</div> : techs.map(t => <div key={t.techId ?? Math.random()} style={{ padding:'10px 12px', borderRadius:8, background:'#fafafa', marginBottom:8, display:'flex', justifyContent:'space-between' }}>{t.name}<Badge>{t.count}</Badge></div>)}
            </div>
          </Card>
        </div>

        <div style={{ width:420 }}>
          <Card>
            <h4 className="small">Guías de Servicio Recientes</h4>
            <div style={{ marginTop:8 }}>
              {recent.length === 0 ? <div className="small">No hay guías recientes</div> : recent.slice(0,7).map(s => (
                <div key={s.id} style={{ padding:'12px', borderRadius:8, border:'1px solid #f3f4f6', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700 }}>{s.type ?? 'Servicio'}</div>
                    <div className="small" style={{ color:'#8b8b8b' }}>{s.client?.name ?? ''}</div>
                    <div className="small" style={{ marginTop:6 }}>{s.date ? new Date(s.date).toLocaleDateString() : ''}</div>
                  </div>
                  <div>
                    <div className="small" style={{ color:'#8b8b8b' }}>{translateStatus(s.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
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