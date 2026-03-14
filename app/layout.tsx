import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'
import Navbar from '@/components/Navbar'
import BottomTabBar from '@/components/BottomTabBar'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'FairGame - Badminton Club Management',
  description: 'Smart badminton club management with fair pairing algorithms',
  manifest: '/manifest.json',
  themeColor: '#16A34A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FairGame',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased">
        <SessionProvider>
          <ThemeProvider>
            <Navbar />
            {children}
            <BottomTabBar />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
