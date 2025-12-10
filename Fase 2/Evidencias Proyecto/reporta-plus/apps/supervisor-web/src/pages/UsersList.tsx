import { useEffect, useState } from 'react'
import api from '../api/client'
import Card from '../components/Card'
import AppLayout from '../components/AppLayout'
import Modal from '../components/Modal'
import UserForm from './_forms/UserForm'
import Icon from '../components/Icon'
import { PencilSimple } from 'phosphor-react'
import { showToast } from '../components/Toast'

function Avatar({ name }: { name?: string }) {
  const initials = (name || 'U').split(' ').map(n => n[0] ?? '').slice(0,2).join('').toUpperCase()
  return <div style={{ width:56, height:56, borderRadius:999, background:'#ff8a5b', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{initials}</div>
}

export default function UsersList() {
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
      const { data } = await api.get('/users', { params:{ page, pageSize } })
      setItems(data.items || data || [])
      setTotal(data.total ?? (data.items?.length ?? data?.length ?? 0))
    }catch(e){ console.error(e); showToast('Error cargando usuarios','error') }finally{ setLoading(false) }
  }

  function onCreate(){ setEditing(null); setOpen(true) }
  function onEdit(u:any){ setEditing(u); setOpen(true) }
  async function onDelete(u:any){ if(!confirm('¿Eliminar usuario?')) return; await api.delete(`/users/${u.id}`); load() }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <AppLayout>
      <div className="header">
        <div>
          <div className="brand">Usuarios y Técnicos</div>
          <div className="small">Gestiona cuentas de usuario y permisos</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={onCreate}>+ Agregar Usuario</button>
        </div>
      </div>

      <Card>
        <div style={{ marginBottom:12 }}>
          <input placeholder="Buscar usuarios por nombre, usuario o email..." className="input" />
        </div>

        <div className="list-grid" style={{ marginTop:6 }}>
          {items.map(u => (
            <div key={u.id} className="user-card">
              <div style={{ display:'flex', gap:12 }}>
                <Avatar name={u.name} />
              </div>

              <div className="user-info">
                <div className="user-top">
                  <div>
                    <div className="user-name">{u.name}</div>
                    <div className="small" style={{ color:'#8b8b8b' }}>{u.username ?? u.email}</div>
                  </div>
                </div>

                <div style={{ marginTop:8 }}>
                  <div style={{ marginBottom:8 }}>
                    <span className="badge">{u.role ?? 'Técnico'}</span>
                  </div>
                  <div className="small" style={{ marginTop:8 }}>
                    {u.email && <div>✉️ {u.email}</div>}
                    {u.phone && <div>📞 {u.phone}</div>}
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                <button className="btn secondary" onClick={()=>onEdit(u)} title="Editar"><Icon C={PencilSimple} size={14} /></button>
                <div className="small" style={{ marginTop:12 }}>{u.active ? 'Activo' : 'Inactivo'}</div>
              </div>
            </div>
          ))}
        </div>

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

      <Modal open={open} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'} onClose={()=>setOpen(false)}>
        <UserForm user={editing} onSaved={()=>{ setOpen(false); load(); showToast('Usuario guardado', 'success') }} onCancel={()=>setOpen(false)} />
      </Modal>
    </AppLayout>
  )
}