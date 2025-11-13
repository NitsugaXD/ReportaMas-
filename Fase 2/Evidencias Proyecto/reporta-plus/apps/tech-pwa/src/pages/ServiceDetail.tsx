import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

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

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const { data } = await api.get(`/services/${id}`)
        if (mounted) setSvc(data)
      } catch (e: any) {
        if (mounted) setErr(e?.response?.data?.message || e?.message || 'Error al cargar servicio')
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

  const photos = svc.files.filter((f) => f.kind === 'PHOTO' || f.kind === 'SIGNATURE')
  const others = svc.files.filter((f) => f.kind === 'PDF' || f.kind === 'XLSX')

  const dateStr = new Date(svc.date).toLocaleString()

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

      <div className="border rounded-lg p-3 bg-white space-y-1">
        <p><span className="font-semibold">Cliente:</span> {svc.client?.name ?? '—'}</p>
        <p>
          <span className="font-semibold">Sitio:</span>{' '}
          {svc.site?.name ?? '—'}
          {svc.site?.address ? ` — ${svc.site.address}` : ''}
        </p>
        <p><span className="font-semibold">Técnico:</span> {svc.tech?.name ?? '—'}</p>
        <p><span className="font-semibold">Fecha:</span> {dateStr}</p>
        <p><span className="font-semibold">Tipo:</span> {svc.type}</p>
        <p><span className="font-semibold">Estado:</span> {svc.status}</p>
        {svc.notes && (
          <p className="mt-2">
            <span className="font-semibold">Notas:</span><br />
            {svc.notes}
          </p>
        )}
      </div>

      {/* FOTOS / FIRMAS */}
      <div className="border rounded-lg p-3 bg-white">
        <h2 className="font-semibold mb-2">Fotos y firmas</h2>
        {photos.length === 0 && <p className="text-sm text-gray-500">No hay imágenes adjuntas.</p>}
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
              {/* 👇 Aquí ya mostramos la foto directamente */}
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
        {others.length === 0 && <p className="text-sm text-gray-500">No hay archivos PDF/Excel.</p>}
        <ul className="space-y-1">
          {others.map((f) => (
            <li key={f.id}>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline text-sm"
              >
                {f.kind === 'PDF' ? 'Informe PDF' : 'Reporte Excel'} ({f.id.slice(0, 8)}…)
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}