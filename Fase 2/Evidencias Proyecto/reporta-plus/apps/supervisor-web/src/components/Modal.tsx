import React from 'react'

export default function Modal({ open, title, onClose, children }: { open: boolean; title?: string; onClose: ()=>void; children?: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="modal-center" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-body">
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <h3 style={{ margin:0 }}>{title}</h3>
            <button className="btn secondary" onClick={onClose}>Cerrar</button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}