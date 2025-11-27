import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import AnimatedButton from '../components/AnimatedButton'
import { AnimatedInput, AnimatedTextarea, AnimatedSelect } from '../components/AnimatedInput'
import Loader from '../components/Loader'

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

  if (loading) return <Loader />

  return (
    <div className="min-h-screen px-4 py-6 bg-base-light dark:bg-base-dark text-tmain-light dark:text-tmain-dark transition-colors">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold tracking-tight">Editar servicio</h1>
          <AnimatedButton
            type="button"
            onClick={handleCancel}
            className="text-sm px-2 py-1 underline bg-transparent text-brand-primary hover:text-brand-hover"
          >
            Cancelar
          </AnimatedButton>
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
          <AnimatedInput
            name="clientName"
            value={form.clientName}
            onChange={handleChange}
            placeholder="Nombre del cliente"
          />

          <AnimatedInput
            name="siteName"
            value={form.siteName}
            onChange={handleChange}
            placeholder="Nombre del sitio (ej: Parque de Nogales)"
          />

          <AnimatedInput
            name="siteAddress"
            value={form.siteAddress}
            onChange={handleChange}
            placeholder="Dirección"
          />

          <AnimatedSelect
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <option value="Mantención">Mantención</option>
            <option value="Servicio técnico">Servicio técnico</option>
            <option value="Servicio informático">Servicio informático</option>
          </AnimatedSelect>

          <AnimatedTextarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Observaciones / sugerencias"
            rows={4}
          />

          <AnimatedButton
            type="submit"
            disabled={saving}
            className="w-full mt-3"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </AnimatedButton>
        </form>
      </div>
    </div>
  )
}