import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Área do Cliente - D&M Consultoria",
  description: "Portal de dashboards financeiros empresariais",
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
