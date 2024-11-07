'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, Cloud, ArrowRight } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

const FloatingElement = ({ children, className }: { children: React.ReactNode; className: string }) => (
    <motion.div
        className={`absolute ${className}`}
        animate={{
            y: [0, 10, 0],
            opacity: [0.7, 1, 0.7],
        }}
        transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
        }}
    >
        {children}
    </motion.div>
)

const AnimatedIcon = ({ icon: Icon, delay = 0 }: { icon: any; delay?: number }) => (
    <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
    >
        <Icon className="h-6 w-6 text-blue-400" />
    </motion.div>
)

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full overflow-hidden relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMDAwMDAwMjAiPjwvcmVjdD4KPHBhdGggZD0iTTAgNUw1IDBaTTYgNEw0IDZaTS0xIDFMMSAtMVoiIHN0cm9rZT0iIzIwMjAyMDIwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-30"></div>

            <FloatingElement className="top-20 left-20">
                <Cloud className="h-16 w-16 text-blue-300 opacity-20" />
            </FloatingElement>
            <FloatingElement className="bottom-20 right-20">
                <Lock className="h-16 w-16 text-blue-300 opacity-20" />
            </FloatingElement>

            <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-slate-200/20 shadow-xl rounded-2xl p-8">
                <div className="space-y-6">
                    <motion.div
                        className="flex items-center gap-3 mb-6"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Cloud className="h-10 w-10 text-blue-400" />
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                            OneDrive Manager
                        </h1>
                    </motion.div>
                    <p className="text-slate-300 text-center">
                        Securely access and manage your OneDrive files
                    </p>

                    <div className="space-y-4">
                        <motion.div
                            className="flex items-start gap-3"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <AnimatedIcon icon={Shield} delay={0.2} />
                            <div>
                                <h2 className="font-medium text-white">Secure Microsoft Authentication</h2>
                                <p className="text-sm text-slate-300">Industry-standard security protocols</p>
                            </div>
                        </motion.div>
                        <motion.div
                            className="flex items-start gap-3"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <AnimatedIcon icon={Lock} delay={0.4} />
                            <div>
                                <h2 className="font-medium text-white">End-to-end encryption</h2>
                                <p className="text-sm text-slate-300">Your data is always protected</p>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Button
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
                            onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
                        >
                            Sign in with Microsoft
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>

                    <p className="text-sm text-slate-300 text-center">
                        By signing in, you agree to our{' '}
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Terms of Service
                        </a>
                        {' '}and{' '}
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
} 