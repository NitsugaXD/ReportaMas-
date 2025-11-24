import { useState, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ulid } from 'ulid'
import SignatureCanvas from 'react-signature-canvas'
import api from '../api/client'
import { db } from '../db/dexie'
import { useAuth } from '../stores/auth'

type FileKind = 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX'

type FormState = {
  clientName: string
  siteName: string
  siteAddress: string
  type: string
  notes: string
}

type FileAttachment = { file: File; kind: FileKind }

type PendingFiles = {
  photos: File[]
  attachments: FileAttachment[]
  signature?: File | null
}

export default function ServiceNew() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)

  const [form, setForm] = useState<FormState>({
    clientName: '',
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

  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [signErr, setSignErr] = useState('')
  const [isDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('theme') === 'dark'
  })

  const sigRef = useRef<SignatureCanvas | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const [showPhotoSource, setShowPhotoSource] = useState(false)

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handlePhotosChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const list = Array.from(e.target.files)
    setFiles((prev) => ({ ...prev, photos: [...prev.photos, ...list] }))
  }

  function handleAttachmentsChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const list = Array.from(e.target.files)
    const mapped: FileAttachment[] = list.map((file) => {
      const name = file.name.toLowerCase()
      let kind: FileKind = 'PHOTO'
      if (name.endsWith('.pdf')) kind = 'PDF'
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) kind = 'XLSX'
      return { file, kind }
    })
    setFiles((prev) => ({ ...prev, attachments: [...prev.attachments, ...mapped] }))
  }

  function handleClearSignature() {
    sigRef.current?.clear()
    setFiles((prev) => ({ ...prev, signature: null }))
    setSignErr('')
  }

  function handleCaptureSignature() {
    const sig = sigRef.current
    if (!sig || sig.isEmpty()) {
      setSignErr('Primero dibuja la firma.')
      return
    }
    const dataUrl = sig.toDataURL('image/png')
    const file = dataURLToFile(dataUrl, `firma-${Date.now()}.png`)
    setFiles((prev) => ({ ...prev, signature: file }))
    setSignErr('')
  }

  async function createOnline(dto: any, pending: PendingFiles) {
    const { data: svc } = await api.post('/services', dto)

    const uploads: Promise<any>[] = []

    for (const photo of pending.photos) {
      const fd = new FormData()
      fd.append('file', photo)
      uploads.push(
        api.post(`/services/${svc.id}/files?kind=PHOTO`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      )
    }

    for (const att of pending.attachments) {
      const fd = new FormData()
      fd.append('file', att.file)
      uploads.push(
        api.post(`/services/${svc.id}/files?kind=${att.kind}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      )
    }

    if (pending.signature) {
      const fd = new FormData()
      fd.append('file', pending.signature)
      uploads.push(
        api.post(`/services/${svc.id}/files?kind=SIGNATURE`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      )
    }

    if (uploads.length) {
      await Promise.all(uploads)
    }

    return svc
  }

  async function createOffline(dto: any, pending: PendingFiles) {
    await db.outbox.add({
      kind: 'CREATE_SERVICE',
      payload: { dto, files: pending },
      createdAt: Date.now(),
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setSignErr('')
    setLoading(true)

    try {
      if (!user?.id) {
        throw new Error('No se encontró el usuario autenticado.')
      }

      const serviceUid = ulid()
      const dto = {
        serviceUid,
        clientName: form.clientName,
        siteName: form.siteName,
        siteAddress: form.siteAddress,
        type: form.type,
        notes: form.notes,
        date: new Date().toISOString(),
        techId: user.id,
      }

      const pending: PendingFiles = {
        photos: files.photos,
        attachments: files.attachments,
        signature: files.signature || undefined,
      }

      if (navigator.onLine) {
        const svc = await createOnline(dto, pending)
        nav(`/s/${svc.id}`)
      } else {
        await createOffline(dto, pending)
        alert(
          'Sin conexión: el servicio y los archivos se guardaron localmente y se enviarán automáticamente al recuperar la red.',
        )
        nav('/')
      }
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          'Error inesperado al crear el servicio',
      )
    } finally {
      setLoading(false)
    }
  }

  function openPhotoSourceModal() {
    setShowPhotoSource(true)
  }

  function chooseGallery() {
    setShowPhotoSource(false)
    galleryInputRef.current?.click()
  }

  function chooseCamera() {
    setShowPhotoSource(false)
    cameraInputRef.current?.click()
  }

  function handleCancel() {
    nav(-1)
  }

  return (
    <div
      className={`min-h-screen px-4 py-6 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold tracking-tight">
            Nuevo servicio
          </h1>
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm underline hover:opacity-80 transition"
          >
            Cancelar
          </button>
        </div>

        {err && (
          <div className="mb-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
            {err}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className={`space-y-3 rounded-xl p-4 shadow-sm border ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200'
          }`}
        >
          <input
            name="clientName"
            value={form.clientName}
            onChange={handleChange}
            placeholder="Nombre del cliente"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          />

          <input
            name="siteName"
            value={form.siteName}
            onChange={handleChange}
            placeholder="Nombre del sitio (ej: Parque de Nogales)"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          />

          <input
            name="siteAddress"
            value={form.siteAddress}
            onChange={handleChange}
            placeholder="Dirección"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          />

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          >
            <option value="Mantención">Mantención</option>
            <option value="Servicio técnico">Servicio técnico</option>
            <option value="Servicio informático">Servicio informático</option>
          </select>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Observaciones / sugerencias"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            rows={4}
          />

          <div>
            <label className="block text-sm font-medium mb-1">
              Fotos (imágenes)
            </label>

            <button
              type="button"
              onClick={openPhotoSourceModal}
              className="px-3 py-2 text-sm rounded bg-black text-white hover:scale-[1.02] hover:shadow-md transition"
            >
              Añadir foto
            </button>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotosChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={handlePhotosChange}
            />

            {files.photos.length > 0 && (
              <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
                {files.photos.map((f, i) => (
                  <li key={i}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Archivos adjuntos (PDF / Excel)
            </label>
            <input
              type="file"
              multiple
              onChange={handleAttachmentsChange}
              className="text-sm"
            />
            {files.attachments.length > 0 && (
              <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
                {files.attachments.map((att, i) => (
                  <li key={i}>
                    {att.file.name} ({att.kind})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Firma del cliente
            </label>
            <div className="border rounded w-full h-40 overflow-hidden bg-white">
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                  className: 'w-full h-full',
                }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleClearSignature}
                className="px-3 py-1 text-xs rounded border hover:bg-gray-100 transition"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleCaptureSignature}
                className="px-3 py-1 text-xs rounded border bg-black text-white hover:scale-[1.02] transition"
              >
                Guardar firma
              </button>
            </div>
            {files.signature && (
              <p className="mt-1 text-xs text-green-700">
                Firma capturada ({files.signature.name})
              </p>
            )}
            {signErr && (
              <p className="mt-1 text-xs text-red-600">
                {signErr}
              </p>
            )}
            <p className="mt-1 text-[11px] text-gray-500">
              La firma se sube como archivo de tipo SIGNATURE asociado al
              servicio.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full px-4 py-2 rounded bg-black text-white disabled:opacity-50 hover:scale-[1.02] hover:shadow-md transition"
          >
            {loading ? 'Creando...' : 'Crear servicio'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-2">
          Si no hay conexión, el servicio y los archivos se guardarán en el
          dispositivo y se enviarán automáticamente al recuperar la red.
        </p>
      </div>

      {showPhotoSource && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-4 w-72 shadow-lg space-y-3">
            <h2 className="text-sm font-semibold">Agregar foto</h2>
            <p className="text-xs text-gray-600">
              Elige cómo deseas cargar la imagen.
            </p>
            <button
              type="button"
              onClick={chooseGallery}
              className="w-full px-3 py-2 text-sm rounded border hover:bg-gray-100 transition"
            >
              Elegir desde galería
            </button>
            <button
              type="button"
              onClick={chooseCamera}
              className="w-full px-3 py-2 text-sm rounded bg-black text-white hover:scale-[1.02] transition"
            >
              Tomar foto con cámara
            </button>
            <button
              type="button"
              onClick={() => setShowPhotoSource(false)}
              className="w-full px-3 py-2 text-xs rounded border mt-1 hover:bg-gray-100 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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