import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Peru Scanner - Cámaras y Emergencias',
  description: 'Visualiza cámaras públicas y reportes de emergencias en Perú en tiempo real',
  keywords: ['Perú', 'Lima', 'cámaras públicas', 'emergencias', 'INDECI', 'tráfico'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
