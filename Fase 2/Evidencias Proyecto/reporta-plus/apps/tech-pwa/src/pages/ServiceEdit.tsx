import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
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

  const [form, setForm] = useState<FormState>({
    clientName: '',
    siteName: '',
    siteAddress: '',
    type: 'Servicio informático',
    notes: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const { data } = await api.get(`/services/${id}`)
        if (!mounted) return

        setForm({
          clientName: data.client?.name ?? '',
          siteName: data.site?.name ?? '',
          siteAddress: data.site?.address ?? '',
          type: data.type ?? 'Servicio informático',
          notes: data.notes ?? '',
        })
      } catch (e: any) {
        if (mounted) {
          setErr(
            e?.response?.data?.message ||
              e?.message ||
              'Error al cargar servicio para edición',
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id])

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setSaving(true)

    try {
      await api.patch(`/services/${id}`, {
        clientName: form.clientName,
        siteName: form.siteName,
        siteAddress: form.siteAddress,
        type: form.type,
        notes: form.notes,
      })

      navigate(`/s/${id}`)
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          'Error al guardar cambios del servicio',
      )
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 bg-base-light dark:bg-base-dark text-tmain-light dark:text-tmain-dark">
        <div className="max-w-lg mx-auto">Cargando servicio...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 bg-base-light dark:bg-base-dark text-tmain-light dark:text-tmain-dark transition-colors">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold tracking-tight">
            Editar servicio
          </h1>
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm underline text-brand-primary hover:text-brand-hover transition"
          >
            Cancelar
          </button>
        </div>

        {err && (
          <div className="mb-3 text-sm border rounded px-3 py-2 border-red-300 bg-red-50 text-red-700">
            {err}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-xl p-4 shadow-sm border bg-card-light border-borderc-light dark:bg-card-dark dark:border-borderc-dark"
        >
          <input
            name="clientName"
            value={form.clientName}
            onChange={handleChange}
            placeholder="Nombre del cliente"
            className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
          />

          <input
            name="siteName"
            value={form.siteName}
            onChange={handleChange}
            placeholder="Nombre del sitio (ej: Parque de Nogales)"
            className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
          />

          <input
            name="siteAddress"
            value={form.siteAddress}
            onChange={handleChange}
            placeholder="Dirección"
            className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
          />

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark"
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
            rows={4}
            className="w-full border rounded px-3 py-2 text-sm bg-card-light border-borderc-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 rounded font-medium text-white bg-gradient-to-r from-brand-primary to-accent-light dark:from-brand-darkPrimary dark:to-accent-dark hover:brightness-110 active:scale-[0.98] transition disabled:opacity-70"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}