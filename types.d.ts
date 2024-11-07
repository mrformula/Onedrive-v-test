interface FileItem {
    id: string
    name: string
    type: 'file' | 'folder'
    size?: number
    lastModified?: string
    downloadUrl?: string
    path: string
    parentId?: string
    itemCount?: number
}

interface User {
    id: string
    name: string
    email: string
    image?: string
}

interface Session {
    user: User
    expires: string
    accessToken?: string
} 