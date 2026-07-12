/**
 * Keyring Ethereum basado en viem.
 * Las claves viven cifradas en IndexedDB; en memoria solo tras unlock.
 * @see https://viem.sh/docs/accounts/local/mnemonicToAccount
 */

import { useEffect, useState, useCallback } from 'react'
import {
  english,
  generateMnemonic as viemGenerateMnemonic,
  mnemonicToAccount,
  privateKeyToAccount,
} from 'viem/accounts'
import type { Address, Hex, LocalAccount } from 'viem'
import { isAddress, isHex } from 'viem'
import { encrypt, decrypt } from '@/utils/encryption'
import {
  saveEncryptedAccount,
  getAllEncryptedAccounts,
  deleteEncryptedAccount,
} from '@/utils/secureStorage'
import { authenticateWithWebAuthn } from '@/utils/webauthn'
import {
  getWebAuthnCredential,
  updateWebAuthnCredentialUsage,
  getAllWebAuthnCredentials,
} from '@/utils/webauthnStorage'

/** Payload cifrado por cuenta */
interface StoredSecret {
  mnemonic?: string | null
  privateKey?: Hex | null
  path?: string
}

export interface KeyringAccount {
  /** Cuenta local viem (firma mensajes/txs) */
  account: LocalAccount
  /**
   * Alias de `account` para no romper consumidores que usaban KeyringPair.
   * Preferir `account`.
   */
  pair: LocalAccount
  address: Address
  publicKey: Hex
  meta: {
    name?: string
    [key: string]: any
  }
}

function toKeyringAccount(account: LocalAccount, meta: KeyringAccount['meta']): KeyringAccount {
  return {
    account,
    pair: account,
    address: account.address,
    publicKey: account.publicKey,
    meta,
  }
}

function accountFromSecret(secret: StoredSecret, meta: KeyringAccount['meta']): KeyringAccount {
  if (secret.mnemonic) {
    const account = mnemonicToAccount(secret.mnemonic, {
      path: (secret.path as `m/44'/60'/${string}`) || "m/44'/60'/0'/0/0",
    })
    return toKeyringAccount(account, meta)
  }
  if (secret.privateKey) {
    const account = privateKeyToAccount(secret.privateKey)
    return toKeyringAccount(account, meta)
  }
  throw new Error('Secreto sin mnemonic ni privateKey')
}

function normalizePrivateKey(input: string): Hex {
  const trimmed = input.trim()
  const withPrefix = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`
  if (!isHex(withPrefix) || withPrefix.length !== 66) {
    throw new Error('Clave privada inválida (se esperan 32 bytes en hex)')
  }
  return withPrefix as Hex
}

export function useKeyring() {
  const [isReady, setIsReady] = useState(false)
  const [accounts, setAccounts] = useState<KeyringAccount[]>([])
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [hasStoredAccounts, setHasStoredAccounts] = useState(false)
  const [hasWebAuthnCredentials, setHasWebAuthnCredentials] = useState(false)

  const checkWebAuthnCredentials = useCallback(async () => {
    try {
      const webauthnCreds = await getAllWebAuthnCredentials()
      const hasCreds = webauthnCreds.length > 0
      setHasWebAuthnCredentials(hasCreds)
      return hasCreds
    } catch (error) {
      console.error('[Keyring] Error al verificar credenciales WebAuthn:', error)
      setHasWebAuthnCredentials(false)
      return false
    }
  }, [])

  const checkStoredAccounts = useCallback(async () => {
    try {
      const stored = await getAllEncryptedAccounts()
      const hasAccounts = stored.length > 0
      setHasStoredAccounts(hasAccounts)
      return hasAccounts
    } catch (error) {
      console.error('[Keyring] Error al verificar cuentas almacenadas:', error)
      setHasStoredAccounts(false)
      return false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        await checkStoredAccounts()
        await checkWebAuthnCredentials()
        if (isMounted) setIsReady(true)
      } catch (error) {
        console.error('[Keyring] Error al inicializar:', error)
        if (isMounted) setIsReady(true)
      }
    }

    init()
    return () => {
      isMounted = false
    }
  }, [checkStoredAccounts, checkWebAuthnCredentials])

  const generateMnemonic = useCallback(() => {
    return viemGenerateMnemonic(english, 128)
  }, [])

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    try {
      const encryptedAccounts = await getAllEncryptedAccounts()

      if (encryptedAccounts.length === 0) {
        setIsUnlocked(true)
        return true
      }

      try {
        await decrypt(encryptedAccounts[0].encryptedData, password)
      } catch {
        return false
      }

      const loadedAccounts: KeyringAccount[] = []

      for (const encAccount of encryptedAccounts) {
        try {
          const decryptedData = await decrypt(encAccount.encryptedData, password)
          const parsed = JSON.parse(decryptedData) as StoredSecret & {
            isPolkadotJson?: boolean
            uri?: string
            type?: string
          }

          if (parsed.isPolkadotJson) {
            console.warn(
              `[Keyring] Cuenta Substrate/Polkadot.js ignorada (${encAccount.address}). Migra a Ethereum.`
            )
            continue
          }

          // Legacy Substrate: uri/mnemonic + type sr25519 — no cargar
          if (parsed.type && parsed.type !== 'secp256k1' && parsed.type !== 'ecdsa' && !parsed.privateKey) {
            // ecdsa substrate no es path BIP-44 Ethereum; solo aceptar mnemonic/privateKey eth
            if (!parsed.mnemonic && !parsed.privateKey) {
              console.warn(`[Keyring] Cuenta legacy ignorada: ${encAccount.address}`)
              continue
            }
          }

          const secret: StoredSecret = {
            mnemonic: parsed.mnemonic ?? null,
            privateKey: parsed.privateKey ?? null,
            path: parsed.path,
          }

          // Si solo hay uri legacy sin privateKey eth, saltar
          if (!secret.mnemonic && !secret.privateKey) {
            console.warn(`[Keyring] Sin secreto Ethereum en ${encAccount.address}`)
            continue
          }

          const account = accountFromSecret(secret, encAccount.meta || {})
          if (account.address.toLowerCase() !== encAccount.address.toLowerCase()) {
            console.warn(
              `[Keyring] Dirección distinta: guardada ${encAccount.address}, derivada ${account.address}`
            )
          }
          loadedAccounts.push(account)
        } catch (error) {
          console.error(`[Keyring] Error al cargar ${encAccount.address}:`, error)
        }
      }

      setAccounts(loadedAccounts)
      setIsUnlocked(true)
      return true
    } catch (error) {
      console.error('[Keyring] Error al desbloquear:', error)
      return false
    }
  }, [])

  const unlockWithWebAuthn = useCallback(async (credentialId: string): Promise<boolean> => {
    try {
      const encryptedAccounts = await getAllEncryptedAccounts()

      if (encryptedAccounts.length === 0) {
        setIsUnlocked(true)
        return true
      }

      const credential = await getWebAuthnCredential(credentialId)
      if (!credential) {
        console.error('[Keyring] Credencial WebAuthn no encontrada')
        return false
      }

      const authResult = await authenticateWithWebAuthn(credentialId)
      await updateWebAuthnCredentialUsage(credentialId)

      let masterKeySalt: Uint8Array
      if (credential.masterKeySalt) {
        const { base64UrlToArrayBuffer } = await import('@/utils/webauthn')
        masterKeySalt = new Uint8Array(base64UrlToArrayBuffer(credential.masterKeySalt))
      } else {
        const { generateMasterKeySalt, arrayBufferToBase64Url } = await import('@/utils/webauthn')
        const { saveWebAuthnCredential } = await import('@/utils/webauthnStorage')
        masterKeySalt = generateMasterKeySalt()
        credential.masterKeySalt = arrayBufferToBase64Url(masterKeySalt.buffer)
        await saveWebAuthnCredential(credential)
      }

      const { deriveKeyFromWebAuthn } = await import('@/utils/webauthn')
      const masterKey = await deriveKeyFromWebAuthn(
        authResult.signature,
        authResult.authenticatorData,
        masterKeySalt
      )

      const { decryptWithKey } = await import('@/utils/encryption')
      const loadedAccounts: KeyringAccount[] = []

      for (const encAccount of encryptedAccounts) {
        try {
          const decryptedData = await decryptWithKey(encAccount.encryptedData, masterKey)
          const parsed = JSON.parse(decryptedData) as StoredSecret
          if (!parsed.mnemonic && !parsed.privateKey) continue
          loadedAccounts.push(accountFromSecret(parsed, encAccount.meta || {}))
        } catch (error) {
          console.warn(`[Keyring] WebAuthn no pudo abrir ${encAccount.address}:`, error)
        }
      }

      if (loadedAccounts.length === 0) {
        setIsUnlocked(true)
        return true
      }

      setAccounts(loadedAccounts)
      setIsUnlocked(true)
      return true
    } catch (error) {
      console.error('[Keyring] Error WebAuthn unlock:', error)
      return false
    }
  }, [])

  const lock = useCallback(() => {
    setAccounts([])
    setIsUnlocked(false)
  }, [])

  const persistAccount = async (
    krAccount: KeyringAccount,
    secret: StoredSecret,
    password: string
  ) => {
    const encryptedData = await encrypt(
      JSON.stringify({
        mnemonic: secret.mnemonic ?? null,
        privateKey: secret.privateKey ?? null,
        path: secret.path ?? "m/44'/60'/0'/0/0",
      }),
      password
    )

    await saveEncryptedAccount({
      address: krAccount.address,
      encryptedData,
      publicKey: krAccount.publicKey,
      type: 'secp256k1',
      ethereumAddress: krAccount.address,
      meta: krAccount.meta,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    setHasStoredAccounts(true)
  }

  const ensureCanAdd = async (): Promise<boolean> => {
    const encryptedAccounts = await getAllEncryptedAccounts()
    const hasStored = encryptedAccounts.length > 0
    if (!isUnlocked && hasStored) {
      console.error('[Keyring] Keyring bloqueado')
      return false
    }
    if (!hasStored && !isUnlocked) {
      setIsUnlocked(true)
    }
    return true
  }

  const addFromMnemonic = useCallback(
    async (
      mnemonic: string,
      name?: string,
      typeOrPassword?: string,
      maybePassword?: string
    ): Promise<KeyringAccount | null> => {
      // Compat: (mnemonic, name, type, password) | (mnemonic, name, password)
      const substrateTypes = ['sr25519', 'ed25519', 'ecdsa', 'secp256k1']
      let password: string | undefined
      if (maybePassword !== undefined) {
        password = maybePassword
      } else if (typeOrPassword && !substrateTypes.includes(typeOrPassword)) {
        password = typeOrPassword
      } else {
        password = maybePassword
      }

      if (!(await ensureCanAdd())) return null

      try {
        const meta = { name: name || 'Account' }
        const secret: StoredSecret = {
          mnemonic: mnemonic.trim(),
          privateKey: null,
          path: "m/44'/60'/0'/0/0",
        }
        const krAccount = accountFromSecret(secret, meta)

        setAccounts((prev) => [...prev, krAccount])

        if (password) {
          try {
            await persistAccount(krAccount, secret, password)
          } catch (error) {
            setAccounts((prev) => prev.filter((a) => a.address !== krAccount.address))
            throw error
          }
        } else {
          console.warn(
            `[Keyring] Cuenta ${krAccount.address} solo en memoria (sin contraseña)`
          )
        }

        return krAccount
      } catch (error) {
        console.error('[Keyring] Error addFromMnemonic:', error)
        throw error
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isUnlocked]
  )

  /**
   * Importa desde clave privada hex (0x… o sin prefijo)
   */
  const addFromPrivateKey = useCallback(
    async (
      privateKeyInput: string,
      name?: string,
      password?: string
    ): Promise<KeyringAccount | null> => {
      if (!(await ensureCanAdd())) return null

      try {
        const privateKey = normalizePrivateKey(privateKeyInput)
        const meta = { name: name || 'Account' }
        const secret: StoredSecret = { mnemonic: null, privateKey }
        const krAccount = accountFromSecret(secret, meta)

        setAccounts((prev) => [...prev, krAccount])

        if (password) {
          try {
            await persistAccount(krAccount, secret, password)
          } catch (error) {
            setAccounts((prev) => prev.filter((a) => a.address !== krAccount.address))
            throw error
          }
        }

        return krAccount
      } catch (error) {
        console.error('[Keyring] Error addFromPrivateKey:', error)
        throw error
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isUnlocked]
  )

  /**
   * Compat: URI / seed hex → se trata como private key
   */
  const addFromUri = useCallback(
    async (
      uri: string,
      name?: string,
      _type?: string,
      password?: string
    ): Promise<KeyringAccount | null> => {
      return addFromPrivateKey(uri, name, password)
    },
    [addFromPrivateKey]
  )

  /**
   * Compat con firmas antiguas. JSON Polkadot.js ya no se soporta.
   * Si el objeto parece un encrypted keystore Ethereum futuro, se puede extender aquí.
   */
  const addFromJson = useCallback(
    async (
      _jsonData: object,
      _jsonPassword: string,
      _password?: string
    ): Promise<KeyringAccount | null> => {
      throw new Error(
        'Importación JSON de Polkadot.js no está disponible. Usa mnemonic o clave privada Ethereum.'
      )
    },
    []
  )

  const removeAccount = useCallback(async (address: string) => {
    try {
      setAccounts((prev) => prev.filter((acc) => acc.address.toLowerCase() !== address.toLowerCase()))
      await deleteEncryptedAccount(address)
      // Intentar también checksum / lowercase por si la keyPath difiere
      if (isAddress(address)) {
        try {
          await deleteEncryptedAccount(address.toLowerCase())
        } catch {
          /* ignore */
        }
      }
      const remaining = await getAllEncryptedAccounts()
      setHasStoredAccounts(remaining.length > 0)
      return true
    } catch (error) {
      console.error('[Keyring] Error al eliminar cuenta:', error)
      return false
    }
  }, [])

  const getAccount = useCallback(
    (address: string) => {
      return accounts.find((acc) => acc.address.toLowerCase() === address.toLowerCase())
    },
    [accounts]
  )

  /** No-op: SS58 no aplica en Ethereum (compat API) */
  const setSS58Format = useCallback((_format: number) => {
    console.warn('[Keyring] setSS58Format ignorado (wallet Ethereum)')
  }, [])

  return {
    /** Siempre null: ya no hay @polkadot/keyring */
    keyring: null as null,
    isReady,
    accounts,
    isUnlocked,
    hasStoredAccounts,
    hasWebAuthnCredentials,
    generateMnemonic,
    unlock,
    unlockWithWebAuthn,
    lock,
    addFromMnemonic,
    addFromPrivateKey,
    addFromUri,
    addFromJson,
    removeAccount,
    getAccount,
    setSS58Format,
    refreshWebAuthnCredentials: checkWebAuthnCredentials,
    refreshStoredAccounts: checkStoredAccounts,
  }
}
