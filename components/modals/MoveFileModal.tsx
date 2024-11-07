'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFolder, FiX, FiChevronRight, FiArrowLeft } from 'react-icons/fi'
import { getOneDriveService } from '@/lib/onedrive'

interface MoveFileModalProps {
    isOpen: boolean
    onClose: () => void
    onMove: (destinationPath: string) => Promise<void>
    currentPath: string
    selectedFiles: FileItem[]
}

export default function MoveFileModal({
    isOpen,
    onClose,
    onMove,
    currentPath,
    selectedFiles
}: MoveFileModalProps) {
    const [selectedPath, setSelectedPath] = useState(currentPath)
    const [isLoading, setIsLoading] = useState(false)
    const [folders, setFolders] = useState<FileItem[]>([])
    const [pathHistory, setPathHistory] = useState<string[]>(['/'])
    const [currentBrowsePath, setCurrentBrowsePath] = useState('/')
    const [localSelectedFiles, setLocalSelectedFiles] = useState<FileItem[]>([])

    // Set local selected files when modal opens
    useEffect(() => {
        if (isOpen && selectedFiles.length > 0) {
            setLocalSelectedFiles(selectedFiles)
        }
    }, [isOpen, selectedFiles])

    // Load folders when modal opens or path changes
    useEffect(() => {
        if (isOpen) {
            loadFolders(currentBrowsePath)
        }
    }, [isOpen, currentBrowsePath])

    const loadFolders = async (path: string) => {
        try {
            const service = await getOneDriveService()
            const files = await service.listFiles(path)
            setFolders(files.filter(f => f.type === 'folder'))
        } catch (error) {
            console.error('Error loading folders:', error)
        }
    }

    const handleFolderClick = (folder: FileItem) => {
        setPathHistory([...pathHistory, currentBrowsePath])
        const newPath = currentBrowsePath === '/' ? `/${folder.name}` : `${currentBrowsePath}/${folder.name}`
        setCurrentBrowsePath(newPath)
        setSelectedPath(newPath)
    }

    const handleBack = () => {
        if (pathHistory.length > 1) {
            const newHistory = [...pathHistory]
            const previousPath = newHistory.pop() || '/'
            setPathHistory(newHistory)
            setCurrentBrowsePath(previousPath)
            setSelectedPath(previousPath)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-gray-800 rounded-xl p-4 md:p-6 w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg md:text-xl font-semibold">
                                Move {localSelectedFiles.length} item{localSelectedFiles.length !== 1 ? 's' : ''}
                            </h2>
                            <button onClick={onClose}>
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={handleBack}
                                    disabled={pathHistory.length <= 1}
                                    className={`p-2 rounded-lg ${pathHistory.length <= 1 ? 'text-gray-500' : 'text-blue-400 hover:bg-blue-500/10'}`}
                                >
                                    <FiArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="text-sm text-gray-400 truncate flex-1">
                                    {currentBrowsePath === '/' ? 'Root' : currentBrowsePath}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {folders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleFolderClick(folder)}
                                        className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-700 transition-colors ${selectedPath === folder.path ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FiFolder className="text-blue-400 text-xl flex-shrink-0" />
                                            <span className="truncate">{folder.name}</span>
                                        </div>
                                        <FiChevronRight className="flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (selectedPath === currentPath) return;

                                    try {
                                        setIsLoading(true)
                                        console.log('Moving to path:', selectedPath)
                                        // Wait for move operation to complete
                                        await onMove(selectedPath)
                                    } catch (error) {
                                        console.error('Error moving items:', error)
                                        alert('Failed to move items')
                                    } finally {
                                        setIsLoading(false)
                                    }
                                }}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2"
                                disabled={isLoading || selectedPath === currentPath}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin">⚪</span>
                                        Moving...
                                    </>
                                ) : (
                                    'Move Here'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 