import React from 'react'
import Card from './Card'

export default function ConfirmDialog({ open, title, message, onCancel, onConfirm }: { open: boolean; title?: string; message?: string; onCancel: ()=>void; onConfirm: ()=>void }) {
  if (!open) return null
  return (
    <div className="modal-center" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onCancel}></div>
      <div className="modal-body">
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h3 style={{ margin:0 }}>{title || 'Confirmar'}</h3>
              <div className="small" style={{ marginTop:6 }}>{message}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn secondary" onClick={onCancel}>Cancelar</button>
              <button className="btn" onClick={onConfirm}>Confirmar</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}