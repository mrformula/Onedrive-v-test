import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
} 