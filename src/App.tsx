import { BrowserRouter } from 'react-router-dom'
import { AppStatus } from '@/components/organisms/AppStatus'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChildProvider } from '@/contexts/ChildContext'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <BrowserRouter>
      <AppStatus />
      <AuthProvider>
        <ChildProvider>
          <AppRoutes />
        </ChildProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
