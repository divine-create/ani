import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: 'demo',
      name: 'Demo',
      credentials: {},
      async authorize() {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/demo`)
        if (!res.ok) return null
        const data = await res.json()
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          image: data.user.avatar_url,
          backend_token: data.token,
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/drive.readonly',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account) return false
      if (account.provider !== 'google') return true  // demo credentials — already validated by authorize()
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            google_id: (profile as any).sub,
            email: profile!.email,
            name: profile!.name,
            avatar_url: (profile as any).picture ?? '',
            access_token: account.access_token ?? '',
            refresh_token: account.refresh_token ?? '',
            token_expiry: account.expires_at
              ? new Date(account.expires_at * 1000).toISOString()
              : '',
          }),
        })
        if (!res.ok) return false
        const data = await res.json()
        ;(account as any).backend_token = data.token
        return true
      } catch {
        return false
      }
    },
    async jwt({ token, account, user }) {
      if (account && (account as any).backend_token) {
        token.backend_token = (account as any).backend_token
      }
      // Credentials provider passes backend_token on user object
      if ((user as any)?.backend_token) {
        token.backend_token = (user as any).backend_token
      }
      return token
    },
    async session({ session, token }) {
      ;(session as any).backend_token = token.backend_token
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})

export const { GET, POST } = handlers
export { auth, signIn, signOut }
