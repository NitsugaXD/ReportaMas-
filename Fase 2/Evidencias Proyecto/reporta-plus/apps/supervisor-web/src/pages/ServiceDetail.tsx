import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import Card from '../components/Card'
import AppLayout from '../components/AppLayout'
import { showToast } from '../components/Toast'
import Icon from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'
import { UploadSimple, ArrowClockwise, Trash } from 'phosphor-react'

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const [svc, setSvc] = useState<any|null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState<number|null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement|null>(null)
  const nav = useNavigate()

  useEffect(()=>{ if(id) load() },[id])

  async function load(){
    setLoading(true)
    try{ const { data } = await api.get(`/services/${id}`); setSvc(data) }catch(e:any){ console.error(e); showToast('Error cargando servicio', 'error') }finally{ setLoading(false) }
  }

  async function changeStatus(next: string){
    if (!svc) return
    try{ await api.patch(`/services/${svc.id}`, { status: next }); showToast('Estado actualizado', 'success'); load() }catch(e:any){ console.error(e); showToast(e?.response?.data?.message || 'Error actualizando', 'error') }
  }

  async function resend() {
    if (!svc) return
    try {
      await api.post(`/services/${svc.id}/resend`)
      showToast('Servicio reenviado', 'success')
    } catch (e:any) {
      showToast(e?.response?.data?.message || 'Error reenviando', 'error')
    }
  }

  async function remove() {
    if (!svc) return
    try {
      await api.delete(`/services/${svc.id}`)
      showToast('Servicio eliminado', 'success')
      nav('/services')
    } catch (e:any) {
      showToast(e?.response?.data?.message || 'Error eliminando servicio', 'error')
    }
  }

  async function onFiles(e?: any) {
    const files: FileList | null = e?.target?.files ?? null
    if (!files || !svc) return
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append('files', f))
    setUploading(true)
    try {
      await api.post(`/services/${svc.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      showToast('Archivos subidos', 'success')
      load()
    } catch (err:any) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Error subiendo archivos', 'error')
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  if (loading) return <AppLayout><div className="small">Cargando...</div></AppLayout>
  if (!svc) return <AppLayout><div>No encontrado</div></AppLayout>

  return (
    <AppLayout>
      <div className="header">
        <div>
          {/* aquí mostramos información humana, nunca UID */}
          <div className="brand">{svc.type ?? (svc.client?.name ?? 'Servicio')}</div>
          <div className="small">Detalle de la guía</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn secondary" onClick={()=>nav('/services')}>Volver</button>
          <button className="btn secondary" onClick={()=>changeStatus('SIGNED')}>Marcar firmado</button>
          <button className="btn secondary" onClick={()=>changeStatus('SENT')}>Enviar</button>
          <button className="btn" onClick={resend} title="Reenviar"><Icon C={ArrowClockwise} /></button>
          <button className="btn" onClick={()=>setConfirmOpen(true)} title="Eliminar"><Icon C={Trash} /></button>
        </div>
      </div>

      <Card>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 360px',gap:16 }}>
          <div>
            <div style={{ marginBottom:8 }}><strong>Cliente:</strong> {svc.client?.name}</div>
            <div style={{ marginBottom:8 }}><strong>Técnico:</strong> {svc.tech?.name}</div>
            <div style={{ marginBottom:8 }}><strong>Tipo:</strong> {svc.type}</div>
            <div style={{ marginBottom:8 }}><strong>Notas:</strong><div className="small">{svc.notes}</div></div>

            <div style={{ marginTop: 12 }}>
              <h4 className="small">Archivos</h4>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10, marginTop:8 }}>
                {(!svc.files || svc.files.length === 0) ? <div className="small">No hay archivos</div> :
                  svc.files.map((f:any, idx:number)=>(
                    <div key={f.id || idx} style={{ border:'1px solid #f3f4f6', borderRadius:8, overflow:'hidden', background:'#fff' }}>
                      {f.url && (/\.(jpg|jpeg|png|webp|gif)$/i).test(f.url) ? (
                        <img src={f.url} alt={f.name || ''} style={{ width:'100%', height:110, objectFit:'cover', cursor:'pointer' }} onClick={()=>setGalleryIndex(idx)} />
                      ) : (
                        <div style={{ padding:10 }}>
                          <a href={f.url} target="_blank" rel="noreferrer" className="small">{f.name || f.url.split('/').pop()}</a>
                        </div>
                      )}
                      <div style={{ padding:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:13 }}>{f.name || ''}</div>
                        <a className="small" href={f.url} target="_blank" rel="noreferrer">Abrir</a>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          <div>
            <div style={{ marginBottom:8 }}>
              <input type="file" multiple ref={fileRef} onChange={onFiles} style={{ display:'none' }} />
              <div style={{ marginTop:8 }}>
                <button className="btn" onClick={()=>fileRef.current?.click()}><Icon C={UploadSimple} /> Añadir archivos</button>
                <div className="small" style={{ marginTop:8 }}>Puedes subir varias fotos a la vez. Se mostrarán como miniaturas.</div>
              </div>
            </div>

            <div style={{ marginTop:20 }}>
              <h4 className="small">Acciones</h4>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                {/* NO hay Editar interno - solo desde lista */}
                <button className="btn" onClick={()=>changeStatus('CLOSED')}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lightbox simple */}
      {galleryIndex !== null && svc.files && (
        <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, background:'rgba(0,0,0,0.7)' }} onClick={()=>setGalleryIndex(null)}>
          <img src={svc.files[galleryIndex].url} alt="" style={{ maxWidth:'92%', maxHeight:'92%', borderRadius:8 }} />
        </div>
      )}

      <ConfirmDialog open={confirmOpen} title="Eliminar servicio" message="¿Seguro que quieres eliminar esta guía? Esta acción no se puede deshacer." onCancel={()=>setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); remove() }} />
    </AppLayout>
  )
}