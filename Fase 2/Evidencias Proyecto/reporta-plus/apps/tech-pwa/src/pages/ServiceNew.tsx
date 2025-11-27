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
  signature?: File | null
}

export default function ServiceNew() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)

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

  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [signErr, setSignErr] = useState('')

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
    setFiles((prev) => ({
      ...prev,
      photos: [...prev.photos, ...list],
    }))
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

    setFiles((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...mapped],
    }))
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
        throw new Error('techId requerido')
      }

      const serviceUid = ulid()
      const dto = {
        serviceUid,
        clientName: form.clientName,
        clientEmail: form.clientEmail || undefined,
        clientPhone: form.clientPhone,
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
          'Sin conexión: el servicio y los archivos se guardarán en el dispositivo y se enviarán automáticamente al recuperar la red.',
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
    nav('/')
  }

  return (
    <div className="min-h-screen px-1 py-6 bg-base-light dark:bg-base-dark text-tmain-light dark:text-tmain-dark transition-colors flex flex-col items-center relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 w-64 h-64 rounded-full bg-brand-soft blur-3xl opacity-70 dark:bg-brand-darkSoft" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-accent-light blur-3xl opacity-60 dark:bg-accent-dark" />
      </div>
      <div className="z-10 w-full max-w-md sm:max-w-lg flex flex-col gap-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Crear Nuevo Servicio</h1>
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-full text-brand-primary bg-transparent border-2 border-brand-primary hover:bg-brand-soft dark:hover:bg-brand-darkSoft font-semibold shadow-sm transition text-sm"
          >
            Cancelar
          </button>
        </div>

        {err && (
          <div className="mb-2 text-sm border border-red-300 rounded px-3 py-2 bg-red-50 text-red-700">
            {err}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl p-4 shadow-sm border bg-card-light border-borderc-light dark:bg-card-dark dark:border-borderc-dark"
        >
          {/* Nombre Cliente */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Nombre Cliente
            </label>
            <input
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
            />
          </div>

          {/* Correo Electronico */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Correo Electrónico del Cliente
            </label>
            <input
              name="clientEmail"
              type="email"
              value={form.clientEmail}
              onChange={handleChange}
              placeholder="Ej: cliente@email.com"
              className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
            />
          </div>

          {/* Telefono/Celular */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Teléfono/Celular
            </label>
            <input
              name="clientPhone"
              type="tel"
              value={form.clientPhone}
              onChange={handleChange}
              placeholder="Ej: +56 9 1234 5678"
              className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
            />
          </div>

          {/* Nombre del edificio/casa */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Nombre del edificio/casa
            </label>
            <input
              name="siteName"
              value={form.siteName}
              onChange={handleChange}
              placeholder="Ej: Parque los Nogales"
              className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
            />
          </div>

          {/* Dirección Completa */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Dirección Completa
            </label>
            <input
              name="siteAddress"
              value={form.siteAddress}
              onChange={handleChange}
              placeholder="Ej: Los Álamos #1234, Colina"
              className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
            />
          </div>

          {/* Tipo de servicio */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Tipo de servicio
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark"
            >
              <option value="Servicio técnico">Servicio Técnico</option>
              <option value="Mantención">Mantención</option>
              <option value="Servicio informático">Servicio Informático</option>
            </select>
          </div>

          {/* Fotografías */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Fotografías
            </label>
            <button
              type="button"
              onClick={openPhotoSourceModal}
              className="px-3 py-2 text-sm rounded font-medium text-white bg-brand-primary hover:bg-brand-hover active:scale-[0.98] hover:shadow-md transition"
            >
              Añadir foto
            </button>
            {files.photos.length > 0 && (
              <ul className="mt-2 text-xs text-tmuted-light dark:text-tmuted-dark list-disc list-inside">
                {files.photos.map((f, i) => (
                  <li key={i}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Adjuntar archivos */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Adjuntar archivos (PDF/Excel)
            </label>
            <input
              type="file"
              multiple
              onChange={handleAttachmentsChange}
              className="block text-sm file:mr-3 file:py-1 file:px-2 file:border file:border-borderc-light file:dark:border-borderc-dark file:rounded file:bg-brand-primary file:text-white hover:file:bg-brand-hover transition"
            />
            {files.attachments.length > 0 && (
              <ul className="mt-2 text-xs text-tmuted-light dark:text-tmuted-dark list-disc list-inside">
                {files.attachments.map((att, i) => (
                  <li key={i}>
                    {att.file.name} ({att.kind})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Firma de cliente */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Firma de cliente
            </label>
            <div className="border border-borderc-light dark:border-borderc-dark rounded bg-card-light dark:bg-card-dark w-full h-40 overflow-hidden">
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                backgroundColor={
                  document.documentElement.classList.contains('dark')
                    ? "#0B0F18"
                    : "#FFFFFF"
                }
                canvasProps={{
                  className: 'signature-canvas w-full h-40 rounded outline-none',
                  style: {
                    width: "100%",
                    height: "100%",
                    borderRadius: "0.5rem",
                  },
                }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleClearSignature}
                className="px-3 py-1 text-xs rounded border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark text-tmain-light dark:text-tmain-dark hover:bg-base-light dark:hover:bg-base-dark transition"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleCaptureSignature}
                className="px-3 py-1 text-xs rounded border border-brand-primary bg-brand-primary text-white hover:bg-brand-hover transition"
              >
                Guardar firma
              </button>
            </div>
            {files.signature && (
              <p className="mt-1 text-xs text-emerald-500">
                Firma capturada ({files.signature.name})
              </p>
            )}
            {signErr && (
              <p className="mt-1 text-xs text-red-500">{signErr}</p>
            )}
            <p className="mt-1 text-[11px] text-tmuted-light dark:text-tmuted-dark">
              La firma se sube como archivo de tipo SIGNATURE asociado al servicio.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-brand-primary to-accent-light dark:from-brand-darkPrimary dark:to-accent-dark hover:brightness-110 active:scale-[0.98] transition disabled:opacity-70"
          >
            {loading ? 'Creando...' : 'Crear Servicio'}
          </button>
        </form>
        <p className="text-xs mt-2 text-tmuted-light dark:text-tmuted-dark">
          Si no hay conexión, el servicio y los archivos se guardarán en el
          dispositivo y se enviarán automáticamente al recuperar la red.
        </p>
      </div>

      {/* MODAL SELECCIÓN FOTO */}
      {showPhotoSource && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="w-72 rounded-xl p-4 shadow-lg border bg-card-light border-borderc-light text-tmain-light space-y-3 dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark">
            <h2 className="text-sm font-semibold text-center">Agregar foto</h2>
            <p className="text-xs text-tmuted-light dark:text-tmuted-dark">
              Elige cómo deseas cargar la imagen.
            </p>
            <button
              type="button"
              onClick={chooseGallery}
              className="w-full px-3 py-2 text-sm rounded border border-borderc-light bg-card-light hover:bg-base-light transition dark:border-borderc-dark dark:bg-card-dark dark:hover:bg-base-dark"
            >
              Elegir desde galería
            </button>
            <button
              type="button"
              onClick={chooseCamera}
              className="w-full px-3 py-2 text-sm rounded font-medium text-white bg-brand-primary hover:bg-brand-hover active:scale-[0.98] transition"
            >
              Tomar foto con cámara
            </button>
            <button
              type="button"
              onClick={() => setShowPhotoSource(false)}
              className="w-full px-3 py-2 text-xs rounded border border-borderc-light bg-card-light hover:bg-base-light mt-1 transition dark:border-borderc-dark dark:bg-card-dark dark:hover:bg-base-dark text-tmuted-light dark:text-tmuted-dark"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* INPUTS OCULTOS GALERÍA / CÁMARA */}
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