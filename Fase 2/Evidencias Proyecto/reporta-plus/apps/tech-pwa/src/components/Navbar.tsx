import { Link } from 'react-router-dom'
import { useOnline } from '../hooks/useOnline'

export default function Navbar() {
  const online = useOnline()

  return (
    <div className="w-full px-4 py-3 bg-white border-b flex justify-between items-center">
      <Link to="/" className="font-semibold text-lg">
        Reporta+ Técnicos
      </Link>

      <span className={online ? 'text-emerald-600' : 'text-red-600'}>
        {online ? 'Online' : 'Offline (se sincronizará)'}
      </span>
    </div>
  )
}
