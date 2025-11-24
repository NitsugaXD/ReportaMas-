import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import SignatureCanvas from 'react-signature-canvas'

function getStatusLabel(status: string) {
  switch (status) {
    case 'DONE':
      return 'Finalizado'
    case 'DRAFT':
    default:
      return 'Creado / Editado'
  }
}

type FileKind = 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX'

type ServiceFile = {
  id: string
  kind: FileKind
  url: string
  createdAt: string
}

type Service = {
  id: string
  serviceUid: string
  type: string
  notes?: string | null
  date: string
  status: string
  client?: { name: string }
  site?: { name: string | null; address: string | null }
  tech?: { name: string }
  files: ServiceFile[]
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const [svc, setSvc] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  const [showPhotoSource, setShowPhotoSource] = useState(false)
  const cameraInput = useRef<HTMLInputElement | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const sigRef = useRef<SignatureCanvas | null>(null)
  const [savingSign, setSavingSign] = useState(false)
  const [signErr, setSignErr] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const { data } = await api.get(`/services/${id}`)
        if (mounted) setSvc(data)
      } catch (e: any) {
        if (mounted)
          setErr(e?.response?.data?.message || 'Error al cargar servicio')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) return <div className="p-4">Cargando...</div>
  if (err) return <div className="p-4 text-red-600">{err}</div>
  if (!svc) return <div className="p-4">Servicio no encontrado</div>

  const photos = svc.files.filter((f) => f.kind === 'PHOTO')
  const signatures = svc.files.filter((f) => f.kind === 'SIGNATURE')
  const otherFiles = svc.files.filter((f) => f.kind === 'PDF' || f.kind === 'XLSX')

  const dateStr = new Date(svc.date).toLocaleString()

  // --- UPLOAD FILE ---
  async function handleUpload(kind: FileKind) {
    if (!file) return
    if (!svc) return

    try {
      setUploading(true)
      setUploadErr('')

      const fd = new FormData()
      fd.append('file', file)

      const { data } = await api.post(
        `/services/${svc.id}/files?kind=${kind}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      setSvc((prev) => (prev ? { ...prev, files: [...prev.files, data] } : prev))
      setFile(null)
      setShowPhotoSource(false)
    } catch (e: any) {
      setUploadErr(e?.response?.data?.message || 'Error al subir archivo')
    } finally {
      setUploading(false)
    }
  }

  // --- SIGNATURE ---
  async function handleSaveSignature() {
    if (!svc) return

    try {
      setSignErr('')
      setSavingSign(true)
      const sig = sigRef.current
      if (!sig || sig.isEmpty()) {
        setSignErr('Primero dibuja la firma.')
        return
      }

      const dataUrl = sig.toDataURL('image/png')
      const res = await fetch(dataUrl)
      const blob = await res.blob()

      const fd = new FormData()
      fd.append('file', blob, 'firma.png')

      const { data } = await api.post(
        `/services/${svc.id}/files?kind=SIGNATURE`,
        fd
      )

      await api.patch(`/services/${svc.id}`, { status: 'DONE' })

      setSvc((prev) =>
        prev
          ? { ...prev, status: 'DONE', files: [...prev.files, data] }
          : prev
      )

      sig.clear()
    } catch (e: any) {
      setSignErr('Error al guardar la firma')
    } finally {
      setSavingSign(false)
    }
  }

  function chooseCamera() {
    setShowPhotoSource(false)
    cameraInput.current?.click()
  }

  function chooseFile() {
    setShowPhotoSource(false)
    fileInput.current?.click()
  }

  return (
    <div className="min-h-screen px-4 py-6 bg-base-light dark:bg-base-dark text-tmain-light dark:text-tmain-dark transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {svc.type} — {svc.site?.name || svc.client?.name}
          </h1>
          <div className="flex gap-2">
            <Link
              to={`/s/${svc.id}/edit`}
              className="px-3 py-1 text-xs rounded border border-borderc-light dark:border-borderc-dark hover:bg-base-light dark:hover:bg-base-dark transition"
            >
              Editar
            </Link>

            <Link
              to="/"
              className="px-3 py-1 text-xs rounded text-brand-primary hover:text-brand-hover transition"
            >
              ← Volver
            </Link>
          </div>
        </div>

        {/* DATOS PRINCIPALES */}
        <div className="rounded-xl border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark p-4 space-y-1 shadow-sm">
          <p><span className="font-semibold">Cliente:</span> {svc.client?.name}</p>
          <p><span className="font-semibold">Sitio:</span> {svc.site?.name} {svc.site?.address ? `— ${svc.site.address}` : ''}</p>
          <p><span className="font-semibold">Técnico:</span> {svc.tech?.name}</p>
          <p><span className="font-semibold">Fecha:</span> {dateStr}</p>
          <p>
            <span className="font-semibold">Estado:</span>{' '}
            {getStatusLabel(svc.status)}
          </p>

          {svc.notes && (
            <p className="pt-2">
              <span className="font-semibold">Notas:</span>
              <br />
              {svc.notes}
            </p>
          )}
        </div>

        {/* FOTOS */}
        <div className="rounded-xl border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Fotos</h2>

            <button
              onClick={() => setShowPhotoSource(true)}
              disabled={uploading}
              className="px-3 py-1 text-sm text-white bg-brand-primary hover:bg-brand-hover rounded active:scale-[0.98] transition disabled:opacity-40"
            >
              Añadir foto
            </button>
          </div>

          {uploadErr && (
            <p className="text-red-500 text-xs mb-2">{uploadErr}</p>
          )}

          {photos.length === 0 && (
            <p className="text-tmuted-light dark:text-tmuted-dark text-sm">
              No hay fotos.
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="border border-borderc-light dark:border-borderc-dark rounded overflow-hidden hover:shadow-md transition"
              >
                <img src={f.url} className="w-full h-32 object-cover" />
              </a>
            ))}
          </div>
        </div>

        {/* FIRMA */}
        <div className="rounded-xl border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark p-4 shadow-sm">
          <h2 className="font-semibold mb-2">Firma del cliente</h2>

          {signatures.length > 0 && (
            <div className="mb-3">
              <img
                src={signatures[0].url}
                alt="Firma"
                className="w-64 h-auto border border-borderc-light dark:border-borderc-dark rounded"
              />
            </div>
          )}

          <div className="border border-borderc-light dark:border-borderc-dark rounded bg-base-light dark:bg-base-dark overflow-hidden">
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: 600,
                height: 200,
                className: 'w-full h-48',
              }}
            />
          </div>

          {signErr && <p className="text-red-500 text-xs mt-1">{signErr}</p>}

          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => sigRef.current?.clear()}
              className="px-3 py-1 rounded border border-borderc-light dark:border-borderc-dark text-sm"
            >
              Limpiar
            </button>

            <button
              disabled={savingSign}
              onClick={handleSaveSignature}
              className="px-3 py-1 text-sm rounded bg-brand-primary text-white hover:bg-brand-hover active:scale-[0.98] transition disabled:opacity-40"
            >
              Guardar firma
            </button>
          </div>
        </div>

        {/* ARCHIVOS PDF/EXCEL */}
        <div className="rounded-xl border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark p-4 shadow-sm">
          <h2 className="font-semibold mb-2">Otros archivos</h2>

          {otherFiles.length === 0 && (
            <p className="text-tmuted-light dark:text-tmuted-dark text-sm">
              No hay archivos PDF/Excel.
            </p>
          )}

          <ul className="space-y-1">
            {otherFiles.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-primary underline hover:text-brand-hover transition text-sm"
                >
                  {f.kind === 'PDF' ? 'Informe PDF' : 'Reporte Excel'} (
                  {f.id.slice(0, 8)}…)
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* MODAL */}
      {showPhotoSource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-borderc-light dark:border-borderc-dark shadow-xl w-72 space-y-3">
            <h3 className="text-center font-semibold mb-2">Agregar foto</h3>

            <button
              onClick={chooseCamera}
              className="w-full px-4 py-2 rounded text-white bg-brand-primary hover:bg-brand-hover active:scale-[0.98] transition"
            >
              Tomar foto con cámara
            </button>
            <button
              onClick={chooseFile}
              className="w-full px-4 py-2 rounded border border-borderc-light dark:border-borderc-dark hover:bg-base-light dark:hover:bg-base-dark transition"
            >
              Elegir de la galería
            </button>

            <button
              onClick={() => setShowPhotoSource(false)}
              className="w-full px-4 py-2 text-sm mt-1 rounded text-tmuted-light dark:text-tmuted-dark hover:text-brand-primary transition"
            >
              Cancelar
            </button>
          </div>

          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null
              setFile(f)
              if (f) handleUpload('PHOTO')
            }}
          />

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null
              setFile(f)
              if (f) handleUpload('PHOTO')
            }}
          />
        </div>
      )}
    </div>
  )
}