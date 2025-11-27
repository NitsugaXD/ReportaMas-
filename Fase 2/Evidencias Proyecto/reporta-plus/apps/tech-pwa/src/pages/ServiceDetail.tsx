import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
  client?: { name: string }
  site?: { name: string | null; address: string | null }
  tech?: { name: string }
  files: ServiceFile[]
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
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

  if (loading) return <Loader />
  if (err) return <div className="p-4 text-red-600">{err}</div>
  if (!svc) return <div className="p-4">Servicio no encontrado</div>

  const photos = svc.files.filter((f) => f.kind === 'PHOTO')
  const signatures = svc.files.filter((f) => f.kind === 'SIGNATURE')
  const otherFiles = svc.files.filter((f) => f.kind === 'PDF' || f.kind === 'XLSX')
  const dateStr = new Date(svc.date).toLocaleString()

  return (
    <div className="min-h-screen px-1 py-6 bg-base-light dark:bg-base-dark text-tmain-light dark:text-tmain-dark transition-colors flex flex-col items-center">
      <div className="w-full max-w-md sm:max-w-2xl flex flex-col gap-6">

        {/* VOLVER */}
        <div className="flex justify-start mb-1">
          <AnimatedButton
            type="button"
            onClick={() => navigate(-1)}
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

        {/* EDITAR (al fondo) */}
        <div className="flex justify-end mt-4">
          <motion.div whileTap={{ scale: 0.94 }}>
            <Link
              to={`/s/${svc.id}/edit`}
              className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-brand-primary to-accent-light shadow hover:brightness-110 focus:ring-2 focus:ring-brand-primary active:scale-95 transition text-base"
              style={{ minWidth: 91 }}
            >
              Editar
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}