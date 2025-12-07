import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ulid } from 'ulid'
import SignatureCanvas from 'react-signature-canvas'
import api from '../api/client'
import { useAuth } from '../stores/auth'
import AnimatedButton from '../components/AnimatedButton'
import { AnimatedInput, AnimatedTextarea, AnimatedSelect } from '../components/AnimatedInput'

type FileKind = 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX'

type FormState = {
  clientName: string
  clientEmail: string
  clientPhone: string
  siteName: string
  siteAddress: string
  type: string
  notes: string
}

type FileAttachment = { file: File; kind: FileKind }

type PendingFiles = {
  photos: File[]
  attachments: FileAttachment[]
  signature: File | null
}

// Helper para convertir el dibujo a archivo
function dataURLToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

// simple debounce
function debounce(fn: () => void, wait = 150) {
  let t: number | undefined
  return () => {
    if (t) window.clearTimeout(t)
    // @ts-ignore
    t = window.setTimeout(fn, wait)
  }
}

export default function ServiceNew() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const sigPadRef = useRef<any>(null)
  const sigContainerRef = useRef<HTMLDivElement | null>(null)

  const [form, setForm] = useState<FormState>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    siteName: '',
    siteAddress: '',
    type: 'Servicio informático',
    notes: '',
  })

  const [files, setFiles] = useState<PendingFiles>({
    photos: [],
    attachments: [],
    signature: null,
  })

  const [saving, setSaving] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [showPhotoSource, setShowPhotoSource] = useState(false)

  // file inputs refs
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // handlers
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhotosChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files)
      setFiles((prev) => ({ ...prev, photos: [...prev.photos, ...newPhotos] }))
    }
    setShowPhotoSource(false)
  }

  const removePhoto = (idx: number) => {
    setFiles((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }))
  }

  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      let kind: FileKind = 'PDF'
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) kind = 'XLSX'
      setFiles((prev) => ({ ...prev, attachments: [...prev.attachments, { file, kind }] }))
    }
  }

  const removeAttachment = (idx: number) => {
    setFiles((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))
  }

  // Resize / DPR fix for signature canvas
  useEffect(() => {
    const resizeCanvas = () => {
      const sc = sigPadRef.current
      const container = sigContainerRef.current
      if (!sc || !container) return
      const canvas: HTMLCanvasElement = sc.getCanvas()
      if (!canvas) return

      // Preserve drawing
      let dataUrl: string | null = null
      try {
        if (typeof sc.toDataURL === 'function' && !sc.isEmpty?.()) {
          dataUrl = sc.toDataURL()
        }
      } catch (err) {
        dataUrl = null
      }

      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const w = container.clientWidth
      const h = container.clientHeight

      canvas.width = Math.round(w * ratio)
      canvas.height = Math.round(h * ratio)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      if (dataUrl) {
        try {
          sc.fromDataURL(dataUrl)
        } catch (err) {
          // ignore
        }
      } else {
        sc.clear()
      }
    }

    resizeCanvas()
    const onResize = debounce(resizeCanvas, 120)
    window.addEventListener('resize', onResize)
    const id = window.setTimeout(resizeCanvas, 200)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // signature logic
  const handleSaveSignature = (e: React.MouseEvent) => {
    e.preventDefault()
    const sc: any = sigPadRef.current
    const isEmpty = sc && typeof sc.isEmpty === 'function' ? sc.isEmpty() : true
    if (sc && !isEmpty) {
      let canvas: HTMLCanvasElement
      if (typeof sc.getTrimmedCanvas === 'function') {
        try {
          canvas = sc.getTrimmedCanvas()
        } catch {
          canvas = sc.getCanvas()
        }
      } else {
        canvas = sc.getCanvas()
      }
      const dataUrl = canvas.toDataURL('image/png')
      const file = dataURLToFile(dataUrl, 'signature.png')
      setFiles(prev => ({ ...prev, signature: file }))
    } else {
      alert('Primero debes firmar en el recuadro.')
    }
  }

  const handleClearSignature = (e: React.MouseEvent) => {
    e.preventDefault()
    setFiles(prev => ({ ...prev, signature: null }))
    setTimeout(() => sigPadRef.current?.clear(), 50)
  }

  // submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.clientName) return alert('Falta el nombre del cliente')

    let finalSignature = files.signature
    const sc: any = sigPadRef.current
    const scIsEmpty = sc && typeof sc.isEmpty === 'function' ? sc.isEmpty() : true
    if (!finalSignature && sc && !scIsEmpty) {
      const canvas = typeof sc.getTrimmedCanvas === 'function' ? sc.getTrimmedCanvas() : sc.getCanvas()
      const dataUrl = canvas.toDataURL('image/png')
      finalSignature = dataURLToFile(dataUrl, 'signature.png')
    }

    if (!finalSignature) {
      if (!confirm('No hay firma guardada. ¿Enviar sin firma?')) return
    }

    try {
      setSaving(true)
      setLoadingText('Creando servicio...')

      const serviceUid = ulid()

      // A. CREAR
      const { data: newService } = await api.post('/services', {
        ...form,
        serviceUid,
        techId: user?.id,
        date: new Date().toISOString(),
      })
      const serviceId = newService.id

      // B. SUBIR FOTOS
      if (files.photos.length > 0) {
        setLoadingText(`Subiendo ${files.photos.length} fotos...`)
        await Promise.all(files.photos.map(file => {
          const fd = new FormData()
          fd.append('file', file)
          return api.post(`/services/${serviceId}/files?kind=PHOTO`, fd)
        }))
      }

      // C. SUBIR ADJUNTOS
      if (files.attachments.length > 0) {
        setLoadingText('Subiendo documentos...')
        await Promise.all(files.attachments.map(att => {
          const fd = new FormData()
          fd.append('file', att.file)
          return api.post(`/services/${serviceId}/files?kind=${att.kind}`, fd)
        }))
      }

      // D. SUBIR FIRMA
      if (finalSignature) {
        setLoadingText('Guardando firma...')
        const fd = new FormData()
        fd.append('file', finalSignature)
        await api.post(`/services/${serviceId}/files?kind=SIGNATURE`, fd)
      }

      // E. GENERAR Y ENVIAR PDF
      setLoadingText('Generando reporte...')
      await api.patch(`/services/${serviceId}/sign-and-send`, {
        notes: form.notes
      })

      alert('¡Listo! Servicio enviado con éxito.')
      nav('/')
    } catch (error: any) {
      console.error(error)
      alert('Error: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
      setLoadingText('')
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* decorative background similar to login */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(600px 300px at 10% 15%, rgba(255,140,60,0.12), transparent), radial-gradient(500px 200px at 90% 85%, rgba(124,58,237,0.06), transparent), linear-gradient(180deg, rgba(10,11,13,0.6), rgba(6,7,8,0.85))',
          mixBlendMode: 'screen',
        }}
      />

      <div className="p-4 pb-32 max-w-xl mx-auto animate-in fade-in duration-500 relative z-10">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-tmain-light dark:text-tmain-dark">Nuevo Servicio</h1>
          <button
            type="button"
            onClick={() => nav('/')}
            className="text-sm text-red-500 font-medium px-3 py-1 bg-red-50 rounded-full hover:bg-red-100 transition dark:bg-red-900/20"
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {/* BLOQUE CLIENTE */}
          <div className="bg-white dark:bg-card-dark p-5 rounded-xl shadow-sm border border-borderc-light dark:border-borderc-dark space-y-4">
            <h2 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Información del Cliente</h2>
            <AnimatedInput name="clientName" value={form.clientName} onChange={handleChange} placeholder="Nombre Cliente *" />
            <AnimatedInput name="clientEmail" value={form.clientEmail} onChange={handleChange} placeholder="Correo (para reporte)" type="email" />
            <AnimatedInput name="clientPhone" value={form.clientPhone} onChange={handleChange} placeholder="Teléfono" type="tel" />
          </div>

          {/* DETALLES */}
          <div className="bg-white dark:bg-card-dark p-5 rounded-xl shadow-sm border border-borderc-light dark:border-borderc-dark space-y-4">
            <h2 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Detalles del Trabajo</h2>
            <div className="grid grid-cols-2 gap-3">
              <AnimatedInput name="siteName" value={form.siteName} onChange={handleChange} placeholder="Nombre Sitio" />
              <AnimatedSelect name="type" value={form.type} onChange={handleChange}>
                <option>Servicio informático</option>
                <option>Mantención</option>
                <option>Reparación</option>
                <option>Instalación</option>
                <option>Visita Técnica</option>
              </AnimatedSelect>
            </div>
            <AnimatedInput name="siteAddress" value={form.siteAddress} onChange={handleChange} placeholder="Dirección" />
            <AnimatedTextarea name="notes" value={form.notes} onChange={handleChange} placeholder="Observaciones..." rows={3} />
          </div>

          {/* FOTOS */}
          <div className="bg-white dark:bg-card-dark p-5 rounded-xl shadow-sm border border-borderc-light dark:border-borderc-dark">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Evidencias ({files.photos.length})</h2>
              <button type="button" onClick={() => setShowPhotoSource(true)} className="text-xs bg-brand-primary text-white px-3 py-1 rounded-full">+ Agregar</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide min-h-[80px]">
              {files.photos.length === 0 && <p className="text-sm text-gray-400 italic">No hay fotos</p>}
              {files.photos.map((file, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* ADJUNTOS */}
          <div className="bg-white dark:bg-card-dark p-5 rounded-xl shadow-sm border border-borderc-light dark:border-borderc-dark">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Adjuntos ({files.attachments.length})</h2>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs border border-brand-primary text-brand-primary px-3 py-1 rounded-full">+ PDF/Excel</button>
            </div>
            <div className="space-y-2">
              {files.attachments.map((att, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm dark:bg-gray-800">
                  <span className="truncate max-w-[200px]">{att.file.name}</span>
                  <button type="button" onClick={() => removeAttachment(idx)} className="text-red-500 text-xs">Eliminar</button>
                </div>
              ))}
            </div>
          </div>

          {/* FIRMA */}
          <div className="bg-white dark:bg-card-dark p-5 rounded-xl shadow-sm border border-borderc-light dark:border-borderc-dark">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Firma del Cliente</h2>
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-sm text-red-500 font-medium px-3 py-1 bg-red-50 rounded-full hover:bg-red-100 transition dark:bg-red-900/20"
              >
                {files.signature ? 'Firmar de nuevo' : 'Limpiar'}
              </button>
            </div>

            <div
              ref={sigContainerRef}
              className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 touch-none relative h-40 flex items-center justify-center overflow-hidden"
            >
              {files.signature ? (
                <img src={URL.createObjectURL(files.signature)} alt="Firma guardada" className="h-full object-contain p-2" />
              ) : (
                <SignatureCanvas
                  ref={sigPadRef}
                  penColor="black"
                  canvasProps={{ className: 'w-full h-full bg-transparent', style: { touchAction: 'none' } }}
                />
              )}
            </div>

            <div className="mt-3">
              {files.signature ? (
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-center dark:bg-emerald-900/20 dark:border-emerald-800">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✅ Firma guardada correctamente</p>
                </div>
              ) : (
                <AnimatedButton
                  type="button"
                  onClick={handleSaveSignature}
                  className="w-full py-3 text-base font-semibold rounded-full shadow-lg"
                >
                  Guardar Firma
                </AnimatedButton>
              )}
            </div>
          </div>

          {/* BOTÓN FINAL */}
          <div className="pt-2 sticky bottom-0 bg-base-light dark:bg-base-dark pb-4 z-10 -mx-1 px-1">
            <AnimatedButton
              type="submit"
              disabled={saving}
              className="w-full py-4 text-lg font-extrabold rounded-xl shadow-2xl transform transition"
            >
              {saving ? loadingText || 'Procesando...' : 'Finalizar y Enviar'}
            </AnimatedButton>
          </div>
        </form>

        {/* Modales */}
        {showPhotoSource && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" onClick={() => setShowPhotoSource(false)}>
            <div className="bg-white dark:bg-card-dark w-full max-w-sm rounded-2xl p-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => galleryInputRef.current?.click()} className="p-3 bg-gray-100 rounded-xl font-medium dark:bg-gray-700">Galería</button>
              <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-3 bg-brand-primary text-white rounded-xl font-medium">Cámara</button>
            </div>
          </div>
        )}

        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handlePhotosChange} />
        <input ref={fileInputRef} type="file" accept=".pdf, .xlsx, .xls" className="hidden" onChange={handleAttachmentChange} />
      </div>
    </div>
  )
}