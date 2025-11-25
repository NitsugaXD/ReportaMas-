import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import SignatureCanvas from 'react-signature-canvas'

type FileKind = 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX'

type ServiceFile = {
  id: string
  kind: FileKind
  url: string
  createdAt: string
  meta?: any
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

  // --- estado para subir archivo/foto
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  // --- firma
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
          setErr(
            e?.response?.data?.message || e?.message || 'Error al cargar servicio',
          )
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

  const photos = svc.files.filter(
    (f) => f.kind === 'PHOTO' || f.kind === 'SIGNATURE',
  )
  const others = svc.files.filter((f) => f.kind === 'PDF' || f.kind === 'XLSX')
  const dateStr = new Date(svc.date).toLocaleString()

  // --- subir archivo (foto/pdf/xlsx)
  async function handleUpload(kind: FileKind) {
    try {
      if (!file) return
      setUploadErr('')
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post(
        `/services/${svc.id}/files?kind=${kind}`,
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      setSvc((prev) => (prev ? { ...prev, files: [...prev.files, data] } : prev))
      setFile(null)
    } catch (e: any) {
      setUploadErr(
        e?.response?.data?.message || e?.message || 'Error al subir archivo',
      )
    } finally {
      setUploading(false)
    }
  }

  // --- guardar firma como imagen PNG
  async function handleSaveSignature() {
    try {
      setSignErr('')
      setSavingSign(true)
      const sig = sigRef.current
      if (!sig || sig.isEmpty()) {
        setSignErr('Primero dibuja la firma.')
        return
      }

      // obtenemos la imagen en base64
      const dataUrl = sig.toDataURL('image/png')
      // la convertimos a Blob
      const res = await fetch(dataUrl)
      const blob = await res.blob()

      const fd = new FormData()
      fd.append('file', blob, 'firma.png')

      const { data } = await api.post(
        `/services/${svc.id}/files?kind=SIGNATURE`,
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      setSvc((prev) => (prev ? { ...prev, files: [...prev.files, data] } : prev))
      sig.clear()
    } catch (e: any) {
      setSignErr(
        e?.response?.data?.message || e?.message || 'Error al guardar firma',
      )
    } finally {
      setSavingSign(false)
    }
  }

  function handleClearSignature() {
    sigRef.current?.clear()
    setSignErr('')
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          Servicio #{svc.serviceUid}
        </h1>
        <Link to="/" className="text-sm text-blue-600 underline">
          ← Volver
        </Link>
      </div>

      {/* Datos principales */}
      <div className="border rounded-lg p-3 bg-white space-y-1">
        <p>
          <span className="font-semibold">Cliente:</span>{' '}
          {svc.client?.name ?? '—'}
        </p>
        <p>
          <span className="font-semibold">Sitio:</span>{' '}
          {svc.site?.name ?? '—'}
          {svc.site?.address ? ` — ${svc.site.address}` : ''}
        </p>
        <p>
          <span className="font-semibold">Técnico:</span>{' '}
          {svc.tech?.name ?? '—'}
        </p>
        <p>
          <span className="font-semibold">Fecha:</span> {dateStr}
        </p>
        <p>
          <span className="font-semibold">Tipo:</span> {svc.type}
        </p>
        <p>
          <span className="font-semibold">Estado:</span> {svc.status}
        </p>
        {svc.notes && (
          <p className="mt-2">
            <span className="font-semibold">Notas:</span>
            <br />
            {svc.notes}
          </p>
        )}
      </div>

      {/* Subir archivo/foto */}
      <div className="border rounded-lg p-3 bg-white space-y-2">
        <h2 className="font-semibold mb-1">Adjuntar archivo / foto</h2>
        <input
          type="file"
          className="block text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        />
        <div className="flex gap-2 mt-1 flex-wrap">
          <button
            type="button"
            disabled={!file || uploading}
            onClick={() => handleUpload('PHOTO')}
            className="px-3 py-1 text-sm rounded bg-black text-white disabled:opacity-40"
          >
            Subir como foto
          </button>
          <button
            type="button"
            disabled={!file || uploading}
            onClick={() => handleUpload('PDF')}
            className="px-3 py-1 text-sm rounded bg-gray-800 text-white disabled:opacity-40"
          >
            Subir como PDF
          </button>
          <button
            type="button"
            disabled={!file || uploading}
            onClick={() => handleUpload('XLSX')}
            className="px-3 py-1 text-sm rounded bg-gray-800 text-white disabled:opacity-40"
          >
            Subir como Excel
          </button>
        </div>
        {uploadErr && <p className="text-red-600 text-xs mt-1">{uploadErr}</p>}
      </div>

      {/* Firma del cliente */}
      <div className="border rounded-lg p-3 bg-white space-y-2">
        <h2 className="font-semibold mb-1">Firma del cliente</h2>
        <p className="text-xs text-gray-500">
          Pide al cliente que firme con el dedo en el recuadro.
        </p>

        <div className="border rounded-md overflow-hidden bg-gray-50">
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
        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            type="button"
            onClick={handleClearSignature}
            className="px-3 py-1 text-sm rounded border border-gray-400"
          >
            Limpiar
          </button>
          <button
            type="button"
            disabled={savingSign}
            onClick={handleSaveSignature}
            className="px-3 py-1 text-sm rounded bg-black text-white disabled:opacity-40"
          >
            Guardar firma
          </button>
        </div>
        {signErr && <p className="text-red-600 text-xs mt-1">{signErr}</p>}
      </div>

      {/* FOTOS / FIRMAS */}
      <div className="border rounded-lg p-3 bg-white">
        <h2 className="font-semibold mb-2">Fotos y firmas</h2>
        {photos.length === 0 && (
          <p className="text-sm text-gray-500">No hay imágenes adjuntas.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="block border rounded overflow-hidden"
              title="Abrir imagen en nueva pestaña"
            >
              <img
                src={f.url}
                alt={f.kind}
                className="w-full h-32 object-cover"
              />
            </a>
          ))}
        </div>
      </div>

      {/* OTROS ARCHIVOS */}
      <div className="border rounded-lg p-3 bg-white">
        <h2 className="font-semibold mb-2">Archivos adjuntos</h2>
        {others.length === 0 && (
          <p className="text-sm text-gray-500">No hay archivos PDF/Excel.</p>
        )}
        <ul className="space-y-1">
          {others.map((f) => (
            <li key={f.id}>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline text-sm"
              >
                {f.kind === 'PDF'
                  ? 'Informe PDF'
                  : f.kind === 'XLSX'
                  ? 'Reporte Excel'
                  : f.kind}{' '}
                ({f.id.slice(0, 8)}…)
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}