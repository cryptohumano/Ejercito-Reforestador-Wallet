/**
 * Helpers hex sin dependencia de @polkadot/util
 */

export function bytesToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex
  if (normalized.length % 2 !== 0) {
    throw new Error('Hex inválido: longitud impar')
  }
  const out = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}
