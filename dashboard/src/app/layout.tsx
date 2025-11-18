import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Funnel & Experiment Analytics',
  description: 'Track user journeys and A/B test experiments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">📊 Analytics Platform</h1>
            <div className="space-x-4">
              <a href="/" className="hover:text-gray-300">Projects</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-8">
          {children}
        </main>
      </body>
    </html>
  )
}
