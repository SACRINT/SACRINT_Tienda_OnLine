import { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Crear Tienda - Tienda Online 2025',
  description: 'Crea tu tienda online en minutos con Tienda Online 2025',
}

export default function SignupPage() {
  return (
    <AuthCard
      title="Crear Tu Tienda"
      description="Comienza a vender en línea hoy mismo"
    >
      <SignupForm />
    </AuthCard>
  )
}
