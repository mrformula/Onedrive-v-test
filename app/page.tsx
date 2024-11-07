'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import LoginPage from '@/components/LoginPage'
import FileManager from '@/components/FileManager'

export default function Home() {
    const { data: session, status } = useSession()

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!session) {
        return <LoginPage />
    }

    return <FileManager />
} 