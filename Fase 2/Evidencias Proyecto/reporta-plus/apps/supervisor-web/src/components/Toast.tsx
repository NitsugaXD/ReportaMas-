import React, { useEffect, useState } from 'react'

type ToastItem = { id: number; message: string; type?: 'success'|'error'|'info' }

/**
 * showToast(message, type) -> emite evento global para mostrar un toast
 */
export function showToast(message: string, type: ToastItem['type']='info') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }))
}

export default function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    let counter = 1
    const handler = (e: any) => {
      const next: ToastItem = { id: counter++, message: e.detail.message, type: e.detail.type }
      setItems(s => [...s, next])
      setTimeout(() => {
        setItems(s => s.filter(i => i.id !== next.id))
      }, 3500)
    }
    window.addEventListener('app-toast', handler as EventListener)
    return () => window.removeEventListener('app-toast', handler as EventListener)
  }, [])

  if (items.length === 0) return null
  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(t => (
        <div key={t.id} style={{
          minWidth: 220,
          padding: 12,
          borderRadius: 8,
          background: t.type === 'error' ? '#fff1f0' : t.type === 'success' ? '#ecfdf5' : '#f8fafc',
          color: t.type === 'error' ? '#991b1b' : '#0f766e',
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.03)'
        }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}