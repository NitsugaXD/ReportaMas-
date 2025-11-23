import { useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../api/client'

type Service = {
  id: string
  type: string
  notes?: string | null
  date: string
  status: string
  client?: { name: string | null }
  site?: { name: string | null; address: string | null }
  version?: number
}

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [svc, setSvc] = useState<Service | null>(null)
  const [type, setType] = useState('Mantención')
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/services/${id}`)
        setSvc(data)
        setType(data.type || 'Mantención')
        setNotes(data.notes || '')
      } catch (e: any) {
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            'No se pudo cargar el servicio',
        )
      }
    }
    if (id) load()
  }, [id])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setErr('')
    setLoading(true)
    try {
      const payload: any = { type, notes }
      if (svc?.version != null) payload.version = svc.version
      await api.patch(`/services/${id}`, payload)
      nav(`/s/${id}`)
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          'No se pudo actualizar el servicio',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleTypeChange(e: ChangeEvent<HTMLSelectElement>) {
    setType(e.target.value)
  }

  function handleNotesChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setNotes(e.target.value)
  }

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-600">ID de servicio inválido</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Editar servicio</h1>

      {svc && (
        <div className="mb-4 text-xs text-gray-600 border rounded px-3 py-2 bg-gray-50">
          <p>
            <span className="font-semibold">Cliente:</span>{' '}
            {svc.client?.name || '—'}
          </p>
          <p>
            <span className="font-semibold">Sitio:</span>{' '}
            {svc.site?.name || '—'}
          </p>
          <p>
            <span className="font-semibold">Dirección:</span>{' '}
            {svc.site?.address || '—'}
          </p>
          <p>
            <span className="font-semibold">Fecha:</span>{' '}
            {new Date(svc.date).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Estado:</span> {svc.status}
          </p>
        </div>
      )}

      {err && (
        <div className="mb-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Tipo de servicio
          </label>
          <select
            value={type}
            onChange={handleTypeChange}
            className="w-full border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="Mantención">Mantención</option>
            <option value="Servicio técnico">Servicio técnico</option>
            <option value="Servicio informático">Servicio informático</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Observaciones / sugerencias
          </label>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            rows={4}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link
            to={`/s/${id}`}
            className="text-sm text-gray-600 underline ml-2"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}