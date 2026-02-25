import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alerta Perú - Cámaras y Emergencias',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
