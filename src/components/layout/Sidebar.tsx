import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Home,
  Wallet,
  Send,
  QrCode,
  History,
  Network,
  Users,
  FileText,
  Trees,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Jornadas', href: '/jornadas', icon: Trees },
  { name: 'Cuentas', href: '/accounts', icon: Wallet },
  { name: 'Enviar', href: '/send', icon: Send },
  { name: 'Recibir', href: '/receive', icon: QrCode },
  { name: 'Transacciones', href: '/transactions', icon: History },
  { name: 'Redes', href: '/networks', icon: Network },
  { name: 'Contactos', href: '/contacts', icon: Users },
  { name: 'Documentos', href: '/documents', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:top-16 border-r bg-background">
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

