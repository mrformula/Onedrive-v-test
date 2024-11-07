import NextAuth from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
import type { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            tenantId: 'common',
        }),
    ],
    callbacks: {
        async jwt({ token, account }: { token: JWT; account: any }) {
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
        async session({ session, token }: { session: any; token: JWT }) {
            session.accessToken = token.accessToken
            return session
        },
    },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 