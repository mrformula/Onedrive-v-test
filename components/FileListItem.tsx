import { FiFolder, FiFile, FiCopy, FiMove, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi'
import { formatFileSize } from '@/lib/utils'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface FileListItemProps {
    file: FileItem
    onFolderClick: (name: string) => void
    onCopyLink: (file: FileItem) => void
    onMove: (file: FileItem) => void
    onRename: (file: FileItem) => void
    onDelete: (file: FileItem) => void
}

export default function FileListItem({
    file,
    onFolderClick,
    onCopyLink,
    onMove,
    onRename,
    onDelete
}: FileListItemProps) {
    const [isCopied, setIsCopied] = useState(false)

    const handleCopyLink = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isCopied) {
            try {
                await onCopyLink(file)
                setIsCopied(true)

                const fileElement = document.getElementById(`file-${file.id}`)
                if (fileElement) {
                    fileElement.classList.add('border', 'border-green-500')
                }

                // Remove copied state after 2 seconds
                setTimeout(() => {
                    setIsCopied(false)
                    const fileElement = document.getElementById(`file-${file.id}`)
                    if (fileElement) {
                        fileElement.classList.remove('border', 'border-green-500')
                    }
                }, 2000)

                // Optional: Show success message
                console.log('Link copied successfully')
            } catch (error) {
                console.error('Failed to copy link:', error)
                alert('Failed to copy download link')
            }
        }
    }

    return (
        <div
            id={`file-${file.id}`}
            className={`flex items-center justify-between p-3 bg-gray-700 rounded-lg transition-all duration-300`}
        >
            <div className="flex items-center gap-3 flex-1">
                {file.type === 'folder' ? (
                    <FiFolder className="text-yellow-400 text-xl" />
                ) : (
                    <FiFile className="text-blue-400 text-xl" />
                )}
                <div className="flex flex-col">
                    <span>{file.name}</span>
                    <span className="text-xs text-gray-400">
                        {file.type === 'folder' ? (
                            <span>
                                {file.itemCount || 0} items • {formatFileSize(file.size || 0)}
                            </span>
                        ) : (
                            formatFileSize(file.size || 0)
                        )}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {file.type === 'file' && (
                    <motion.button
                        onClick={handleCopyLink}
                        className="p-2 hover:bg-gray-500 rounded-full action-button relative"
                        title="Copy download link"
                        whileTap={{ scale: 0.9 }}
                    >
                        <FiCopy className={`text-gray-300 ${isCopied ? 'text-green-400' : ''}`} />
                        {isCopied && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-2 -right-2 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"
                            >
                                <FiCheck className="text-white text-xs" />
                            </motion.div>
                        )}
                    </motion.button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onMove(file)
                    }}
                    className="p-2 hover:bg-gray-500 rounded-full"
                    title="Move"
                >
                    <FiMove className="text-gray-300" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRename(file)
                    }}
                    className="p-2 hover:bg-gray-500 rounded-full"
                    title="Rename"
                >
                    <FiEdit2 className="text-gray-300" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(file)
                    }}
                    className="p-2 hover:bg-gray-500 rounded-full"
                    title="Delete"
                >
                    <FiTrash2 className="text-gray-300" />
                </button>
            </div>
        </div>
    )
} 