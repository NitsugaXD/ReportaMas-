import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ulid } from 'ulid'
import SignatureCanvas from 'react-signature-canvas'
import api from '../api/client'
import { db } from '../db/dexie'

type FileKind = 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX'

type FormState = {
  clientName: string
  siteName: string
  siteAddress: string
  type: string
  notes: string
}

type PendingFiles = {
  photos: File[]
  attachments: { file: File; kind: FileKind }[]
  signature?: File | null
}

// helper para adjuntos
type FileAttachment = { file: File; kind: FileKind }

export default function ServiceNew() {
  const nav = useNavigate()

  const [form, setForm] = useState<FormState>({
    clientName: '',
    siteName: '',
    siteAddress: '',
    type: 'Mantención',
    notes: '',
  })

  const [files, setFiles] = useState<PendingFiles>({
    photos: [],
    attachments: [],
    signature: null,
  })

  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const sigRef = useRef<SignatureCanvas | null>(null)

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handlePhotosChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const list = Array.from(e.target.files)
    setFiles(prev => ({ ...prev, photos: list }))
  }

  function handleAttachmentsChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const list = Array.from(e.target.files)
    const mapped: FileAttachment[] = list.map(file => {
      const ext = file.name.toLowerCase()
      let kind: FileKind = 'PHOTO'
      if (ext.endsWith('.pdf')) kind = 'PDF'
      if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) kind = 'XLSX'
      return { file, kind }
    })
    setFiles(prev => ({ ...prev, attachments: mapped }))
  }

  function clearSignature() {
    sigRef.current?.clear()
    setFiles(prev => ({ ...prev, signature: null }))
  }

  function captureSignature() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      return
    }
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png')
    const file = dataURLToFile(dataUrl, `firma-${Date.now()}.png`)
    setFiles(prev => ({ ...prev, signature: file }))
  }

  async function createOnline(dto: any, pending: PendingFiles) {
    // 1) crear servicio
    const { data: svc } = await api.post('/services', dto)

    // 2) subir archivos (si hay)
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
    setLoading(true)

    try {
      const serviceUid = ulid()
      const dto = {
        serviceUid,
        clientName: form.clientName,
        siteName: form.siteName,
        siteAddress: form.siteAddress,
        type: form.type,
        notes: form.notes,
        date: new Date().toISOString(),
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
          '📡 Sin conexión: el servicio (y archivos) se guardaron localmente y se enviarán al recuperar la red.',
        )
        nav('/')
      }
    } catch (e: any) {
      console.error(e)
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          'Error inesperado al crear el servicio',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Nuevo servicio</h1>

      {err && (
        <div className="mb-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="clientName"
          value={form.clientName}
          onChange={handleChange}
          placeholder="Nombre del cliente"
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <input
          name="siteName"
          value={form.siteName}
          onChange={handleChange}
          placeholder="Nombre del sitio (ej: Parque de Nogales)"
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <input
          name="siteAddress"
          value={form.siteAddress}
          onChange={handleChange}
          placeholder="Dirección"
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-sm bg-white"
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
          className="w-full border rounded px-3 py-2 text-sm"
          rows={4}
        />

        {/* FOTOS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Fotos (imágenes)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotosChange}
            className="text-sm"
          />
          {files.photos.length > 0 && (
            <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
              {files.photos.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        {/* ARCHIVOS */}
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
            <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
              {files.attachments.map((att, i) => (
                <li key={i}>
                  {att.file.name} ({att.kind})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* FIRMA */}
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
              onClick={clearSignature}
              className="px-3 py-1 text-xs rounded border"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={captureSignature}
              className="px-3 py-1 text-xs rounded border bg-black text-white"
            >
              Guardar firma
            </button>
          </div>
          {files.signature && (
            <p className="mt-1 text-xs text-green-700">
              ✔ Firma capturada ({files.signature.name})
            </p>
          )}
          <p className="mt-1 text-[11px] text-gray-500">
            La firma se sube como archivo de tipo SIGNATURE asociado al servicio.
          </p>
        </div>

        <button
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear servicio'}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-2">
        Si no hay conexión, el servicio y los archivos se guardarán en el
        dispositivo y se enviarán automáticamente al recuperar la red.
      </p>
    </div>
  )
}

// helper: dataURL -> File
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