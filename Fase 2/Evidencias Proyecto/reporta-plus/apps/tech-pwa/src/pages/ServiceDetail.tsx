import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import Loader from '../components/Loader'
import AnimatedButton from '../components/AnimatedButton'
import { motion } from 'framer-motion'

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
  client?: { name: string, phone?: string, email?: string }
  clientPhone?: string
  site?: { name: string | null; address: string | null }
  tech?: { name: string }
  files: ServiceFile[]
}

function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="bg-card-light dark:bg-card-dark border border-borderc-light dark:border-borderc-dark rounded-2xl px-8 py-6 shadow-lg space-y-4 max-w-[90vw] w-full" style={{ maxWidth: 320 }}>
        <div className="font-semibold text-lg text-tmain-light dark:text-tmain-dark text-center">¿Eliminar servicio?</div>
        <div className="text-center text-tmuted-light dark:text-tmuted-dark text-sm mb-3">
          Esta acción no se puede deshacer.<br/>¿Seguro que quieres eliminar este servicio?
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded font-semibold border border-borderc-light dark:border-borderc-dark bg-base-light dark:bg-base-dark hover:bg-accent-light dark:hover:bg-accent-dark text-tmain-light dark:text-tmain-dark transition"
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded font-semibold bg-gradient-to-r from-red-600 to-red-400 text-white hover:brightness-110 active:scale-95 transition shadow"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [svc, setSvc] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
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

  const handleDelete = async () => {
    if (!svc) return
    setDeleting(true)
    try {
      await api.delete(`/services/${svc.id}`)
      setShowDeleteModal(false)
      navigate('/')
    } catch (e) {
      alert('Error al eliminar el servicio')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loader />
  if (err) return <div className="p-4 text-red-600">{err}</div>
  if (!svc) return <div className="p-4">Servicio no encontrado</div>

  const photos = svc.files.filter((f) => f.kind === 'PHOTO')
  const signatures = svc.files.filter((f) => f.kind === 'SIGNATURE')
  const otherFiles = svc.files.filter((f) => f.kind === 'PDF' || f.kind === 'XLSX')
  const dateStr = new Date(svc.date).toLocaleString()

  return (
    <div className="min-h-screen px-1 py-6 bg-base-light dark:bg-base-dark text-tmain-light dark:text-tmain-dark transition-colors flex flex-col items-center relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -right-24 w-64 h-64 rounded-full bg-brand-soft blur-3xl opacity-70 dark:bg-brand-darkSoft" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-accent-light blur-3xl opacity-60 dark:bg-accent-dark" />
      </div>
      <div className="z-10 w-full max-w-md sm:max-w-2xl flex flex-col gap-6">

        {/* VOLVER */}
        <div className="flex justify-start mb-1">
          <AnimatedButton
            type="button"
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded-full text-brand-primary bg-transparent border-2 border-brand-primary hover:bg-brand-soft dark:hover:bg-brand-darkSoft font-semibold shadow-sm transition text-sm"
          >
            ← Volver
          </AnimatedButton>
        </div>

        {/* TITULO */}
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-center sm:text-left">
            {svc.type} — {svc.site?.name || svc.client?.name || 'Sin nombre'}
          </h1>
        </div>

        {/* DATOS PRINCIPALES */}
        <div className="rounded-2xl border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark shadow p-5 space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm md:text-base">
              <span className="font-semibold text-accent-light dark:text-accent-dark">Cliente:</span>{" "}
              <span className="font-medium">{svc.client?.name}</span>
            </span>
            {/* Teléfono */}
            {(svc.clientPhone || svc.client?.phone) && (
              <span className="text-sm md:text-base">
                <span className="font-semibold text-accent-light dark:text-accent-dark">Teléfono:</span>{" "}
                <span className="font-medium">{svc.clientPhone || svc.client?.phone}</span>
              </span>
            )}
            {svc.client?.email && (
              <span className="text-sm md:text-base">
                <span className="font-semibold text-accent-light dark:text-accent-dark">Correo:</span>{" "}
                <span className="font-medium">{svc.client.email}</span>
              </span>
            )}
            <span className="text-sm md:text-base">
              <span className="font-semibold text-accent-light dark:text-accent-dark">Sitio:</span>{" "}
              <span className="font-medium">{svc.site?.name}</span>
              {svc.site?.address && (
                <span className="text-tmuted-light dark:text-tmuted-dark text-xs ml-1">— {svc.site.address}</span>
              )}
            </span>
            <span className="text-sm md:text-base">
              <span className="font-semibold text-accent-light dark:text-accent-dark">Técnico:</span>{" "}
              <span className="font-medium">{svc.tech?.name}</span>
            </span>
            <span className="text-sm md:text-base">
              <span className="font-semibold text-accent-light dark:text-accent-dark">Fecha:</span>{" "}
              <span className="font-medium">{dateStr}</span>
            </span>
            <span className="text-sm md:text-base">
              <span className="font-semibold text-accent-light dark:text-accent-dark">Estado:</span>{" "}
              <span className="font-medium">{getStatusLabel(svc.status)}</span>
            </span>
          </div>
          {svc.notes && (
            <div>
              <span className="font-semibold text-accent-light dark:text-accent-dark">Notas:</span>
              <div className="whitespace-pre-line text-base mt-0.5 text-tmain-light dark:text-tmain-dark">{svc.notes}</div>
            </div>
          )}
        </div>

        {/* FOTOS */}
        <div className="rounded-2xl border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark shadow p-5">
          <div className="font-semibold mb-3 text-accent-light dark:text-accent-dark">Fotos</div>
          {photos.length === 0 && (
            <div className="text-sm text-tmuted-light dark:text-tmuted-dark">
              No hay fotos cargadas.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center border border-borderc-light dark:border-borderc-dark rounded-xl overflow-hidden group hover:scale-[1.025] transition"
                style={{ background: "#181922" }}
              >
                <img
                  src={f.url}
                  className="object-contain w-full max-h-64 min-h-[12rem] shadow-lg rounded-xl group-hover:brightness-110 transition"
                  alt="Foto"
                />
              </a>
            ))}
          </div>
        </div>

        {/* FIRMA */}
        <div className="rounded-2xl border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark shadow p-5">
          <div className="font-semibold mb-3 text-accent-light dark:text-accent-dark">Firma del cliente</div>
          {signatures.length === 0 ? (
            <div className="text-sm text-tmuted-light dark:text-tmuted-dark italic">No hay firma registrada.</div>
          ) : (
            <div className="flex items-center justify-center p-2">
              <img
                src={signatures[0].url}
                alt="Firma"
                className="max-h-40 max-w-xs border border-borderc-light dark:border-borderc-dark rounded bg-white dark:bg-base-dark shadow-md"
                style={{ width: "100%", objectFit: "contain" }}
              />
            </div>
          )}
        </div>

        {/* ARCHIVOS PDF/EXCEL */}
        <div className="rounded-2xl border border-borderc-light dark:border-borderc-dark bg-card-light dark:bg-card-dark shadow p-5">
          <div className="font-semibold mb-3 text-accent-light dark:text-accent-dark">Otros archivos</div>
          {otherFiles.length === 0 && (
            <div className="text-sm text-tmuted-light dark:text-tmuted-dark">
              No hay archivos PDF/Excel.
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {otherFiles.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-brand-primary to-accent-light text-white shadow-md font-semibold text-base hover:brightness-110 hover:scale-105 active:scale-97 transition"
                >
                  {f.kind === 'PDF' ? 'Informe PDF' : 'Reporte Excel'} 
                  <span className="ml-2 text-xs font-normal text-tmuted-light dark:text-tmuted-dark">
                    ({f.id.slice(0, 8)}…)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Botones de editar y eliminar */}
        <div className="flex justify-center mt-4 gap-4">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate(`/s/${svc.id}/edit`)}
            className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-brand-primary to-accent-light shadow hover:brightness-110 focus:ring-2 focus:ring-brand-primary active:scale-95 transition text-base"
            style={{ minWidth: 96 }}
          >
            Editar
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-red-500 to-rose-400 shadow hover:bg-gradient-to-tr hover:from-rose-600 hover:to-red-500 hover:brightness-110 focus:ring-2 focus:ring-red-400 active:scale-95 transition text-base"
            style={{ minWidth: 96 }}
          >
            Eliminar
          </motion.button>
          {/* MODAL */}
          <ConfirmDeleteModal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            deleting={deleting}
          />
        </div>
      </div>
    </div>
  )
}