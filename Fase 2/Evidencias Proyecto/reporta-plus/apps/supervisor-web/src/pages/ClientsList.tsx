import { useEffect, useState } from 'react'
import api from '../api/client'
import Card from '../components/Card'
import AppLayout from '../components/AppLayout'
import Modal from '../components/Modal'
import ClientForm from './_forms/ClientForm'
import Icon from '../components/Icon'
import { PencilSimple, Trash } from 'phosphor-react'

export default function ClientsList() {
  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any|null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ load() },[page, pageSize])

  async function load(){
    setLoading(true)
    try{
      const { data } = await api.get('/clients', { params:{ page, pageSize } })
      setItems(data.items || data || [])
      setTotal(data.total ?? data?.length ?? 0)
    }catch(e){ console.error(e) }finally{ setLoading(false) }
  }

  function onCreate(){ setEditing(null); setOpen(true) }
  function onEdit(c:any){ setEditing(c); setOpen(true) }
  async function onDelete(c:any){ if(!confirm('¿Eliminar cliente?')) return; await api.delete(`/clients/${c.id}`); load() }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <AppLayout>
      <div className="header">
        <div>
          <div className="brand">Clientes</div>
          <div className="small">Administrar clientes</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={onCreate}>+ Nuevo</button>
        </div>
      </div>

      <Card>
        <table className="table">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th></th></tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>
                  <button className="btn secondary" onClick={()=>onEdit(c)} title="Editar">
                    <Icon C={PencilSimple} size={14} />
                  </button>
                  <button className="btn" style={{ marginLeft:8 }} onClick={()=>onDelete(c)} title="Eliminar">
                    <Icon C={Trash} size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
          <div className="small">Total: {total}</div>
          <div>
            <button className="btn secondary" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Anterior</button>
            <span style={{ margin:'0 8px' }} className="small">Página {page} / {totalPages}</span>
            <button className="btn secondary" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Siguiente</button>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1) }} style={{ marginLeft:10, padding:8, borderRadius:8 }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </Card>

      <Modal open={open} title={editing ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={()=>setOpen(false)}>
        <ClientForm client={editing} onSaved={()=>{ setOpen(false); load() }} onCancel={()=>setOpen(false)} />
      </Modal>
    </AppLayout>
  )
}