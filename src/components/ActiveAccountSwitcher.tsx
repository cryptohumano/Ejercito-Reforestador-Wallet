/**
 * Componente para cambiar la cuenta activa en la sesión
 */

import { useActiveAccount } from '@/contexts/ActiveAccountContext'
import { useKeyringContext } from '@/contexts/KeyringContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Identicon from '@polkadot/react-identicon'
import { Badge } from '@/components/ui/badge'
import { shortenAddress } from '@/utils/address'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ActiveAccountSwitcher() {
  const { accounts } = useKeyringContext()
  const { activeAccount, switchAccount, activeAccountData } = useActiveAccount()
  const [copied, setCopied] = useState(false)

  if (accounts.length === 0) {
    return null
  }

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  // Una sola cuenta: mostrar nombre + dirección completa truncada
  if (accounts.length === 1) {
    const account = accounts[0]
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="gap-2 px-2.5 py-1.5 max-w-[220px]">
          <Identicon value={account.address} size={16} theme="ethereum" />
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-xs font-medium truncate leading-tight">
              {account.meta.name || 'Cuenta'}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground truncate leading-tight">
              {shortenAddress(account.address, 4)}
            </span>
          </div>
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => copyAddress(account.address)}
          title={account.address}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Select value={activeAccount || ''} onValueChange={switchAccount}>
        <SelectTrigger className="w-auto min-w-[160px] max-w-[240px] h-9">
          <SelectValue>
            {activeAccountData ? (
              <div className="flex items-center gap-2 min-w-0">
                <Identicon
                  value={activeAccountData.address}
                  size={14}
                  theme="ethereum"
                />
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-medium truncate leading-tight">
                    {activeAccountData.meta.name || 'Sin nombre'}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground truncate leading-tight">
                    {shortenAddress(activeAccountData.address, 4)}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs sm:text-sm">Seleccionar cuenta</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.address} value={account.address}>
              <div className="flex items-center gap-2">
                <Identicon value={account.address} size={16} theme="ethereum" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {account.meta.name || 'Sin nombre'}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {shortenAddress(account.address, 6)}
                  </span>
                </div>
                {activeAccount?.toLowerCase() === account.address.toLowerCase() && (
                  <Badge variant="default" className="ml-auto text-xs">
                    Activa
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeAccount && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => copyAddress(activeAccount)}
          title={activeAccount}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  )
}
