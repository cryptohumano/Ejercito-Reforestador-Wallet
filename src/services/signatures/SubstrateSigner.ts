/**
 * Firma documentos con cuentas Ethereum locales (viem LocalAccount)
 */

import { v4 as uuidv4 } from 'uuid'
import type { LocalAccount } from 'viem'
import { toHex } from 'viem'
import { PDFDocument } from 'pdf-lib'
import type { Document, DocumentSignature } from '@/types/documents'
import { calculatePDFHash } from '@/services/pdf/PDFHash'
import { updateDocument } from '@/utils/documentStorage'
import { getAutographicSignature } from '@/utils/autographicSignatureStorage'
import { addAutographicSignature } from './AutographicSigner'

export interface SignDocumentOptions {
  document: Document
  /** Cuenta Ethereum local (viem). Alias histórico: pair */
  pair: LocalAccount
  account?: LocalAccount
  reason?: string
  location?: string
}

/**
 * Firma un documento con una cuenta Ethereum (secp256k1)
 * Nombre legacy: signDocumentWithSubstrate
 */
export async function signDocumentWithSubstrate(
  options: SignDocumentOptions
): Promise<Document> {
  const account = options.account || options.pair
  const { document, reason, location } = options

  if (!document.pdf) {
    throw new Error('El documento no tiene PDF para firmar')
  }

  const pdfHash = await calculatePDFHash(document.pdf)
  const hashBytes = hexToUint8Array(pdfHash)

  const signatureHex = await account.signMessage({
    message: { raw: toHex(hashBytes) },
  })

  let modifiedPdfBase64 = document.pdf
  let modifiedPdfSize = document.pdfSize

  try {
    const base64Data = document.pdf.includes(',') ? document.pdf.split(',')[1] : document.pdf
    const pdfBytes = base64ToUint8Array(base64Data)

    const pdfDoc = await PDFDocument.load(pdfBytes)

    const existingTitle = pdfDoc.getTitle()
    const existingSubject = pdfDoc.getSubject()
    const existingCreator = pdfDoc.getCreator()
    const existingProducer = pdfDoc.getProducer()
    const existingKeywords = pdfDoc.getKeywords()

    const ethAuthor = account.address
    const ethInfo = `Ethereum Account: ${account.address}`
    const newSubject = existingSubject ? `${existingSubject} | ${ethInfo}` : ethInfo

    const newKeywords = [
      ...(Array.isArray(existingKeywords) ? existingKeywords : []),
      `EthereumAccount:${account.address}`,
      'KeyType:secp256k1',
    ]

    if (existingTitle) pdfDoc.setTitle(existingTitle)
    pdfDoc.setAuthor(ethAuthor)
    pdfDoc.setSubject(newSubject)
    if (existingCreator) pdfDoc.setCreator(existingCreator)
    if (existingProducer) pdfDoc.setProducer(existingProducer)
    pdfDoc.setKeywords(newKeywords)

    const modifiedPdfBytes = await pdfDoc.save()
    modifiedPdfBase64 = uint8ArrayToBase64(modifiedPdfBytes)
    modifiedPdfSize = modifiedPdfBytes.length
  } catch (error) {
    console.error('[Ethereum Signer] Error al agregar metadatos:', error)
  }

  try {
    const autographicSignature = await getAutographicSignature(account.address)
    if (autographicSignature && autographicSignature.signatureImage) {
      const tempDocument: Document = {
        ...document,
        pdf: modifiedPdfBase64,
        pdfSize: modifiedPdfSize,
      }

      const documentWithAutographic = await addAutographicSignature({
        document: tempDocument,
        signatureImage: autographicSignature.signatureImage,
        position: {
          page: -1,
          x: -1,
          y: 20,
          width: 60,
          height: 30,
        },
        captureGPS: false,
      })

      modifiedPdfBase64 = documentWithAutographic.pdf || modifiedPdfBase64
      modifiedPdfSize = documentWithAutographic.pdfSize || modifiedPdfSize
    }
  } catch (error) {
    console.warn('[Ethereum Signer] Error firma autográfica:', error)
  }

  const documentSignature: DocumentSignature = {
    id: uuidv4(),
    type: 'substrate',
    signer: account.address,
    signature: signatureHex,
    keyType: 'ecdsa',
    timestamp: Date.now(),
    hash: pdfHash,
    metadata: {
      reason,
      location,
    },
    x509: {
      certificate: '',
      signature: signatureHex,
      certificateInfo: {
        subject: `CN=Ethereum Account, O=${account.address}, OU=secp256k1`,
        issuer: 'Ejército Reforestador',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  }

  const updatedSignatures = [...(document.signatures || []), documentSignature]

  let signatureStatus = document.signatureStatus
  if (document.requiredSigners && document.requiredSigners.length > 0) {
    const signedAddresses = updatedSignatures
      .filter((sig) => sig.signer)
      .map((sig) => sig.signer!)
    const allRequiredSigned = document.requiredSigners.every((addr) =>
      signedAddresses.includes(addr)
    )
    const someRequiredSigned = document.requiredSigners.some((addr) =>
      signedAddresses.includes(addr)
    )
    if (allRequiredSigned) signatureStatus = 'signed'
    else if (someRequiredSigned) signatureStatus = 'partially_signed'
  } else {
    signatureStatus = 'signed'
  }

  const updatedDocument: Document = {
    ...document,
    pdf: modifiedPdfBase64,
    pdfSize: modifiedPdfSize,
    signatures: updatedSignatures,
    signatureStatus,
    updatedAt: Date.now(),
  }

  await updateDocument(updatedDocument)
  return updatedDocument
}

function hexToUint8Array(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function signDocumentWithEthereum(options: SignDocumentOptions): Promise<Document> {
  return signDocumentWithSubstrate(options)
}

/**
 * Verifica una firma digital (tipo legacy `substrate`) hecha con cuenta Ethereum/viem.
 * Comprueba integridad del hash del PDF y la firma personal_sign sobre ese hash.
 */
export async function verifySubstrateSignature(
  document: Document,
  signature: DocumentSignature
): Promise<boolean> {
  if (!document.pdf || !signature.signature || !signature.signer || !signature.hash) {
    return false
  }

  try {
    const currentHash = await calculatePDFHash(document.pdf)
    if (currentHash.toLowerCase() !== signature.hash.toLowerCase()) {
      return false
    }

    const hashBytes = hexToUint8Array(currentHash)
    const { verifyMessage } = await import('viem')
    return await verifyMessage({
      address: signature.signer as `0x${string}`,
      message: { raw: toHex(hashBytes) },
      signature: signature.signature as `0x${string}`,
    })
  } catch (error) {
    console.error('[Ethereum Signer] Error al verificar firma:', error)
    return false
  }
}
