'use client'

import { motion } from 'framer-motion'
import { FiX, FiCheck, FiFile } from 'react-icons/fi'

interface UploadProgressProps {
    fileName: string
    progress: number
    speed?: number
    onCancel?: () => void
    error?: string
}

export default function UploadProgress({ fileName, progress, speed, onCancel, error }: UploadProgressProps) {
    return (
        <div className="bg-gray-800 rounded-lg p-4 mb-2">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <FiFile className="text-blue-400" />
                    <span className="text-sm truncate">{fileName}</span>
                </div>
                {progress < 100 && !error && (
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX />
                    </button>
                )}
                {progress === 100 && !error && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                        <FiCheck className="text-green-400" />
                    </motion.div>
                )}
            </div>

            <div className="space-y-2">
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`absolute h-full ${error ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                    />
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                    <span>{progress}%</span>
                    {speed && <span>{speed.toFixed(2)} MB/s</span>}
                </div>
            </div>

            {error && (
                <div className="text-red-400 text-sm mt-1">
                    {error}
                </div>
            )}
        </div>
    )
} 