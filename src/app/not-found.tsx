import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-4xl font-bold text-gray-900">Página No Encontrada</h2>
      <p className="mt-4 text-lg text-gray-600">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow hover:bg-blue-700"
      >
        Volver a la Página de Inicio
      </Link>
    </div>
  )
}