import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

type ServiceListItem = {
  id: string
  serviceUid: string
  type: string
  date: string
  status: string
  client?: { name: string }
  site?: { name: string | null }
}

type ListResponse = {
  items: ServiceListItem[]
  total: number
  page: number
  pageSize: number
}

export default function ServiceList() {
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        // por ahora, primera página sin filtros
        const { data } = await api.get('/services')
        if (mounted) setData(data)
      } catch (e: any) {
        if (mounted) setErr(e?.response?.data?.message || e?.message || 'Error al cargar servicios')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <div className="p-4">Cargando...</div>
  if (err) return <div className="p-4 text-red-600">{err}</div>
  if (!data) return <div className="p-4">Sin datos.</div>

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Mis servicios</h1>
        <Link
          to="/new"
          className="px-3 py-1 rounded bg-black text-white text-sm"
        >
          + Nuevo
        </Link>
      </div>

      <div className="space-y-2">
        {data.items.length === 0 && (
          <p className="text-sm text-gray-500">
            No hay servicios aún. Crea el primero con el botón “+ Nuevo”.
          </p>
        )}

        {data.items.map((s) => (
          <Link
            key={s.id}
            to={`/s/${s.id}`}
            className="block border rounded-lg p-3 bg-white hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  #{s.serviceUid} — {s.type}
                </p>
                <p className="text-sm text-gray-600">
                  {s.client?.name ?? 'Sin cliente'}
                  {s.site?.name ? ` · ${s.site.name}` : ''}
                </p>
              </div>
              <span
                className={
                  'text-xs px-2 py-1 rounded ' +
                  (s.status === 'DONE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : s.status === 'SIGNED'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700')
                }
              >
                {s.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(s.date).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}