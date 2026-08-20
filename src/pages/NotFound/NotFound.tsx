import { Link } from 'react-router-dom'
import { AuthTemplate } from '@/components/templates/AuthTemplate'

export default function NotFound() {
  return (
    <AuthTemplate title="Página não encontrada" subtitle="O endereço acessado não existe.">
      <Link to="/app">Voltar ao início</Link>
    </AuthTemplate>
  )
}
