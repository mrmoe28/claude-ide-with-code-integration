import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db, hasActiveSubscription } from "./db"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        action: { label: "Action", type: "text" } // 'signin' or 'signup'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const email = credentials.email.toLowerCase().trim()
        const action = credentials.action || 'signin'

        try {
          if (action === 'signup') {
            // Check if user already exists
            const existingUser = await db.getUserByEmail(email)
            if (existingUser) {
              throw new Error("User already exists with this email")
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(credentials.password, 12)

            // Create new user
            const newUser = await db.createUser({
              id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              email: email,
              name: undefined,
              image: undefined,
              email_verified: undefined,
            })
            
            if (!newUser) {
              throw new Error("Failed to create user")
            }

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              hasActiveSubscription: false
            }
          } else {
            // Sign in - get existing user
            const user = await db.getUserByEmail(email)

            if (!user) {
              throw new Error("Invalid email or password")
            }

            // For now, we'll skip password verification since we're using email-based auth
            // In a real implementation, you'd want to add password fields to the database

            // Check subscription status
            const isSubscriptionActive = await hasActiveSubscription(user.id)

                          return {
                id: user.id,
                email: user.email,
                name: user.name,
                hasActiveSubscription: isSubscriptionActive
              }
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error
        }
      }
    })
  ],

  callbacks: {
    async session({ session, token }) {
      if (session?.user && token) {
        (session.user as any).id = token.sub as string
        (session.user as any).hasActiveSubscription = token.hasActiveSubscription as boolean
      }
      return session
    },

    async jwt({ token, user }) {
      if (user) {
        token.hasActiveSubscription = (user as any).hasActiveSubscription
      }
      return token
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',

  // Secure settings for production
  secret: process.env.NEXTAUTH_SECRET,
}
