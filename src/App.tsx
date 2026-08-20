import { BrowserRouter } from 'react-router-dom'
import { AppStatus } from '@/components/organisms/AppStatus'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtocolProvider } from '@/contexts/ProtocolContext'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <BrowserRouter>
      <AppStatus />
      <AuthProvider>
        <ProtocolProvider>
          <AppRoutes />
        </ProtocolProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
