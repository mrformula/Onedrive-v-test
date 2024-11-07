'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FiFolder, FiFile, FiDownload, FiTrash2, FiEdit2, FiCopy, FiArrowLeft, FiMove } from 'react-icons/fi'
import { signOut } from 'next-auth/react'
import { getOneDriveService } from '@/lib/onedrive'
import NewFolderModal from './modals/NewFolderModal'
import MoveFileModal from './modals/MoveFileModal'
import UploadProgress from './UploadProgress'
import FileListItem from './FileListItem'
import { useHotkeys } from 'react-hotkeys-hook'
import type { KeyboardEvent } from 'react'
import { formatFileSize } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function FileManager() {
    const [files, setFiles] = useState<FileItem[]>([])
    const [currentPath, setCurrentPath] = useState('/')
    const [pathHistory, setPathHistory] = useState<string[]>(['/'])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
    const [copiedFiles, setCopiedFiles] = useState<Set<string>>(new Set())
    const [uploadStartTime, setUploadStartTime] = useState<{ [key: string]: number }>({})
    const [uploadSpeed, setUploadSpeed] = useState<{ [key: string]: number }>({})
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
    const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({})
    const [isRenaming, setIsRenaming] = useState(false)
    const [newName, setNewName] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false)
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
    const [selectedFileForMove, setSelectedFileForMove] = useState<FileItem | null>(null)
    const [clipboardItems, setClipboardItems] = useState<FileItem[]>([])
    const [clipboardOperation, setClipboardOperation] = useState<'copy' | 'move' | null>(null)
    const [isPasting, setIsPasting] = useState(false)
    const [totalSize, setTotalSize] = useState(0)
    const [totalItems, setTotalItems] = useState(0)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null)
    const [selectedFileForRename, setSelectedFileForRename] = useState<FileItem | null>(null)

    useEffect(() => {
        loadFiles()
    }, [currentPath])

    const loadFiles = async () => {
        try {
            setLoading(true)
            const service = await getOneDriveService()
            const fileList = await service.listFiles(currentPath)
            setFiles(fileList)

            // Get Public folder stats
            const stats = await service.getPublicFolderStats()
            setTotalSize(stats.size)
            setTotalItems(stats.itemCount)
        } catch (error) {
            console.error('Error loading files:', error)
            alert('Failed to load files')
        } finally {
            setLoading(false)
        }
    }

    const syncWithDatabase = async () => {
        try {
            const response = await fetch('/api/files/sync', {
                method: 'POST',
            })
            if (!response.ok) {
                throw new Error('Failed to sync with database')
            }
        } catch (error) {
            console.error('Error syncing with database:', error)
        }
    }

    const handleFolderClick = (folderPath: string) => {
        setSelectedFiles([])
        setPathHistory([...pathHistory, currentPath])
        setCurrentPath(currentPath === '/' ? `/${folderPath}` : `${currentPath}/${folderPath}`)
    }

    const handleBackClick = () => {
        if (pathHistory.length > 1) {
            const newHistory = [...pathHistory]
            const previousPath = newHistory.pop() || '/'
            setPathHistory(newHistory)
            setCurrentPath(previousPath)
        }
    }

    const handleCopyLink = async (file: FileItem) => {
        try {
            const service = await getOneDriveService()
            const downloadUrl = await service.getDownloadUrl(file.id)

            await navigator.clipboard.writeText(downloadUrl)
            setCopiedFiles(prev => new Set(prev).add(file.id))

            // Remove alert and just show visual feedback
            const fileElement = document.getElementById(`file-${file.id}`)
            if (fileElement) {
                fileElement.classList.add('border-green-500', 'border-2')
            }
        } catch (error) {
            console.error('Failed to copy link:', error)
        }
    }

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Handle file upload with progress
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
            setUploadStartTime(prev => ({ ...prev, [file.name]: Date.now() }))
            const service = await getOneDriveService()

            await service.uploadFile(file, currentPath, (progress: number, speed: number) => {
                setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
                setUploadSpeed(prev => ({ ...prev, [file.name]: speed }))
            })

            await loadFiles()

            // Clear progress after success
            setTimeout(() => {
                setUploadProgress(prev => {
                    const newProgress = { ...prev }
                    delete newProgress[file.name]
                    return newProgress
                })
                setUploadSpeed(prev => {
                    const newSpeed = { ...prev }
                    delete newSpeed[file.name]
                    return newSpeed
                })
            }, 2000)
        } catch (error) {
            console.error('Error uploading file:', error)
            setUploadErrors(prev => ({ ...prev, [file.name]: 'Upload failed' }))
        }
    }

    // Handle new folder creation
    const handleNewFolder = () => {
        setIsNewFolderModalOpen(true)
    }

    // Handle file/folder deletion
    const handleDelete = (file: FileItem) => {
        console.log('Selected file for delete:', file)
        if (!file?.id) {
            console.error('Invalid file selected for deletion')
            return
        }
        setItemToDelete(file)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!itemToDelete?.id) {
            console.error('No item selected for deletion')
            return
        }

        try {
            setLoading(true)
            const service = await getOneDriveService()

            console.log('Attempting to delete file:', itemToDelete)
            await service.deleteItem(itemToDelete.id)
            console.log('Delete successful')

            // First close modal and clear state
            setIsDeleteModalOpen(false)
            setItemToDelete(null)

            // Then refresh file list
            await loadFiles()

        } catch (error) {
            console.error('Error deleting item:', error)
            alert('Failed to delete item')
        } finally {
            setLoading(false)
        }
    }

    // Handle rename
    const handleRename = (file: FileItem) => {
        console.log('Starting rename for:', file)
        setSelectedFileForRename(file)
        setNewName(file.name)
        setIsRenaming(true)
    }

    const submitRename = async () => {
        if (!selectedFileForRename) {
            console.error('No file selected for rename')
            return
        }

        if (!newName.trim()) {
            console.error('New name is empty')
            return
        }

        try {
            setLoading(true)
            const service = await getOneDriveService()

            console.log('Renaming file:', selectedFileForRename.name, 'to', newName)
            await service.renameItem(selectedFileForRename.id, newName.trim())
            console.log('Rename operation successful')

            // First refresh file list
            await loadFiles()

            // Then close modal and clear selection
            setIsRenaming(false)
            setSelectedFileForRename(null)
            setNewName('')
        } catch (error) {
            console.error('Error renaming item:', error)
            alert('Failed to rename item. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Handle move
    const handleMove = (file: FileItem) => {
        console.log('Selected file for move:', file)
        setSelectedFileForMove(file)
        setIsMoveModalOpen(true)
    }

    const handleMoveSubmit = async (destinationPath: string) => {
        if (!selectedFileForMove) {
            console.error('No file selected for move')
            return
        }

        try {
            setLoading(true)
            const service = await getOneDriveService()

            // Clean up the destination path
            const cleanPath = destinationPath.replace(/\s+Nothing$/, '')
            console.log('Moving file:', selectedFileForMove.name, 'to path:', cleanPath)
            await service.moveItem(selectedFileForMove.id, cleanPath)
            console.log('Move operation successful')

            // First refresh file list
            await loadFiles()

            // Then close modal and clear selection
            setIsMoveModalOpen(false)
            setSelectedFileForMove(null)
        } catch (error) {
            console.error('Error moving items:', error)
            alert('Failed to move items. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Handle file selection
    const handleFileSelect = (file: FileItem, event: React.MouseEvent) => {
        event.stopPropagation();

        if (event.ctrlKey || event.metaKey) {
            setSelectedFiles(prev =>
                prev.find(f => f.id === file.id)
                    ? prev.filter(f => f.id !== file.id)
                    : [...prev, file]
            )
        } else if (file.type === 'folder') {
            // If it's a folder and not ctrl/cmd click, just navigate
            handleFolderClick(file.name)
        } else {
            // If it's a file, select it
            setSelectedFiles([file])
        }
    }

    // Add keyboard shortcuts
    useHotkeys<HTMLDivElement>('ctrl+c', () => {
        if (selectedFiles.length > 0) {
            setClipboardItems(selectedFiles)
            setClipboardOperation('move')
        }
    })

    useHotkeys<HTMLDivElement>('ctrl+v', async () => {
        if (clipboardItems.length > 0 && clipboardOperation === 'move') {
            try {
                setIsPasting(true)
                const service = await getOneDriveService()

                for (const item of clipboardItems) {
                    console.log('Moving item:', item.name, 'to path:', currentPath)
                    await service.moveItem(item.id, currentPath)
                }

                await loadFiles()
                setClipboardItems([])
                setClipboardOperation(null)
            } catch (error) {
                console.error('Error pasting items:', error)
                alert('Failed to paste items. Please try again.')
            } finally {
                setIsPasting(false)
            }
        }
    })

    // Update handleFileSelect to deselect when clicking outside
    const handleBackgroundClick = (e: React.MouseEvent) => {
        // Only deselect if clicking directly on the background
        if ((e.target as HTMLElement).classList.contains('file-list-background')) {
            setSelectedFiles([])
        }
    }

    // Add useEffect for global click handler
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            // Get all elements with these classes
            const isFileListClick = (e.target as Element).closest('.file-list-item')
            const isActionButton = (e.target as Element).closest('.action-button')
            const isSearchInput = (e.target as Element).closest('.search-input')

            // If click is not on a file item, action button, or search input, clear selection
            if (!isFileListClick && !isActionButton && !isSearchInput) {
                setSelectedFiles([])
            }
        }

        // Add global click listener
        document.addEventListener('click', handleGlobalClick)

        // Cleanup
        return () => {
            document.removeEventListener('click', handleGlobalClick)
        }
    }, [])

    return (
        <div className="container mx-auto p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    OneDrive File Manager
                </h1>
                <div className="flex items-center gap-4">
                    <div className="bg-gray-800 px-4 py-2 rounded-lg text-sm">
                        <span className="text-gray-400">Total:</span>{' '}
                        <span className="text-white">{totalItems} items</span>{' • '}
                        <span className="text-white">{formatFileSize(totalSize)}</span>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={handleBackClick}
                    disabled={pathHistory.length <= 1}
                    className={`p-2 rounded-lg ${pathHistory.length <= 1 ? 'text-gray-500' : 'text-blue-400 hover:bg-blue-500/10'}`}
                >
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-gray-400">
                    Current path: {currentPath === '/' ? 'Root' : currentPath}
                </div>
            </div>

            {/* File upload input (hidden) */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Search and Actions */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search files..."
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Upload File
                </button>
                <button
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                    onClick={handleNewFolder}
                >
                    New Folder
                </button>
            </div>

            {/* Rename Modal */}
            {isRenaming && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Rename Item</h3>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    submitRename()
                                }
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setIsRenaming(false)
                                    setNewName('')
                                    setSelectedFiles([])
                                }}
                                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRename}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
                            >
                                Rename
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Progress */}
            <div className="mb-4 space-y-2">
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                    <UploadProgress
                        key={fileName}
                        fileName={fileName}
                        progress={progress}
                        speed={uploadSpeed[fileName]}
                        error={uploadErrors[fileName]}
                        onCancel={() => {
                            setUploadProgress(prev => {
                                const newProgress = { ...prev }
                                delete newProgress[fileName]
                                return newProgress
                            })
                        }}
                    />
                ))}
            </div>

            {/* File List */}
            <div className="bg-gray-800 rounded-lg p-4 relative">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                        <div>Loading...</div>
                    </div>
                ) : (
                    <>
                        {isPasting && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
                                <div className="bg-gray-800 p-4 rounded-lg shadow-xl flex items-center gap-3">
                                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    <span>Moving items...</span>
                                </div>
                            </div>
                        )}
                        <div className="grid gap-4">
                            {filteredFiles.map(file => (
                                <div
                                    key={file.id}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleFileSelect(file, e)
                                    }}
                                    className={`file-list-item ${selectedFiles.find(f => f.id === file.id)
                                        ? 'ring-2 ring-blue-500'
                                        : ''
                                        } ${copiedFiles.has(file.id)
                                            ? 'border-green-500 border-2'
                                            : ''
                                        }`}
                                >
                                    <FileListItem
                                        file={file}
                                        onFolderClick={() => { }}
                                        onCopyLink={() => handleCopyLink(file)}
                                        onMove={handleMove}
                                        onRename={handleRename}
                                        onDelete={() => handleDelete(file)}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <NewFolderModal
                isOpen={isNewFolderModalOpen}
                onClose={() => setIsNewFolderModalOpen(false)}
                onSubmit={async (name) => {
                    try {
                        setLoading(true)
                        const service = await getOneDriveService()
                        await service.createFolder(name, currentPath)
                        await loadFiles()
                        setIsNewFolderModalOpen(false)
                    } catch (error) {
                        console.error('Error creating folder:', error)
                        alert('Failed to create folder')
                        throw error
                    } finally {
                        setLoading(false)
                    }
                }}
            />

            <MoveFileModal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                onMove={handleMoveSubmit}
                currentPath={currentPath}
                selectedFiles={selectedFiles}
            />

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl"
                    >
                        <h3 className="text-xl font-semibold mb-4">Delete Item</h3>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false)
                                    setItemToDelete(null)
                                }}
                                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors flex items-center gap-2"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
} 