'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFolder, FiX, FiCheck } from 'react-icons/fi'

interface NewFolderModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (name: string) => Promise<void>
}

export default function NewFolderModal({ isOpen, onClose, onSubmit }: NewFolderModalProps) {
    const [folderName, setFolderName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const validateFolderName = (name: string) => {
        if (!name.trim()) return 'Folder name cannot be empty'
        if (name.length > 255) return 'Folder name is too long'
        if (/[<>:"/\\|?*]/.test(name)) return 'Folder name contains invalid characters'
        return ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationError = validateFolderName(folderName)
        if (validationError) {
            setError(validationError)
            return
        }

        setIsLoading(true)
        setError('')
        try {
            await onSubmit(folderName)
            onClose()
        } catch (error) {
            setError('Failed to create folder')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FiFolder className="text-blue-400" />
                                Create New Folder
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={folderName}
                                        onChange={(e) => {
                                            setFolderName(e.target.value)
                                            setError('')
                                        }}
                                        className={`w-full bg-gray-700 text-white px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-gray-600'
                                            } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all pr-10`}
                                        placeholder="Enter folder name"
                                        autoFocus
                                    />
                                    {folderName && !error && (
                                        <FiCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                                    )}
                                </div>
                                {error && (
                                    <p className="text-red-400 text-sm mt-1">{error}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isLoading || !folderName.trim()
                                        ? 'bg-blue-500/50 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                    disabled={isLoading || !folderName.trim()}
                                >
                                    {isLoading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                ⚪
                                            </motion.div>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Folder'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 