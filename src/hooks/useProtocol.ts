import { useContext } from 'react'
import { ProtocolContext } from '@/contexts/ProtocolContext'

export function useProtocol() {
  const context = useContext(ProtocolContext)
  if (!context) throw new Error('useProtocol precisa estar dentro de <ProtocolProvider>')
  return context
}
