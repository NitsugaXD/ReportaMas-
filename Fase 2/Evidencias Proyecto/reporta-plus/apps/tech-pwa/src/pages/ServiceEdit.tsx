import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

type FormState = {
  clientName: string
  siteName: string
  siteAddress: string
  type: string
  notes: string
}

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState<FormState>({
    clientName: '',
    siteName: '',
    siteAddress: '',
    type: '',
    notes: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/services/${id}`)
        setForm({
          clientName: data.client?.name ?? '',
          siteName: data.site?.name ?? '',
          siteAddress: data.site?.address ?? '',
          type: data.type,
          notes: data.notes ?? '',
        })
      } catch (e: any) {
        setErr(
          e?.response?.data?.message || e?.message || 'Error al cargar servicio'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.patch(`/services/${id}`, {
        type: form.type,
        notes: form.notes,
      })
      navigate(`/s/${id}`)
    } catch (e: any) {
      setErr(
        e?.response?.data?.message || e?.message || 'Error al guardar cambios'
      )
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>
  if (err) return <div className="p-4 text-red-600">{err}</div>

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Editar servicio</h1>

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-sm font-semibold">Cliente</label>
          <input
            name="clientName"
            value={form.clientName}
            className="border rounded p-2 w-full"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Sitio</label>
          <input
            name="siteName"
            value={form.siteName}
            className="border rounded p-2 w-full"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Dirección</label>
          <input
            name="siteAddress"
            value={form.siteAddress}
            className="border rounded p-2 w-full"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Tipo de servicio</label>
          <input
            name="type"
            value={form.type}
            className="border rounded p-2 w-full"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Notas</label>
          <textarea
            name="notes"
            value={form.notes}
            className="border rounded p-2 w-full h-24"
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  )
}