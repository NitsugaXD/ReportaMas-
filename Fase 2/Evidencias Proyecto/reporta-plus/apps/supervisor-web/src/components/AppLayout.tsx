import React from 'react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-root">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}