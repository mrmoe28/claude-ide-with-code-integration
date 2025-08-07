import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { 
  getUserByEmail, 
  createUser, 
  createSession, 
  getSessionAndUser, 
  deleteSession,
  updateSession 
} from "./db"
import { isSubscriptionActive } from "./stripe"

export const authOptions: NextAuthOptions = {
  // Use database sessions instead of JWTs for better security and subscription tracking
  session: {
    strategy: "database",
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
            const existingUser = await getUserByEmail(email)
            if (existingUser) {
              throw new Error("User already exists with this email")
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(credentials.password, 12)

            // Create new user
            const newUser = await createUser(email, hashedPassword)
            
            return {
              id: newUser.id.toString(),
              email: newUser.email,
              name: newUser.name,
              hasActiveSubscription: false
            }
          } else {
            // Sign in - get existing user
            const user = await getUserByEmail(email)

            if (!user || !user.password) {
              throw new Error("Invalid email or password")
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

            if (!isPasswordValid) {
              throw new Error("Invalid email or password")
            }

            // Check subscription status
            const hasActiveSubscription = user.subscription_status ? 
              isSubscriptionActive({
                status: user.subscription_status,
                current_period_end: user.current_period_end
              }) : false

            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              hasActiveSubscription
            }
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error
        }
      }
    })
  ],

  // Custom database adapter for better Vercel compatibility
  adapter: {
    async createUser(user) {
      const newUser = await createUser(user.email, '', user.name)
      return {
        id: newUser.id.toString(),
        email: newUser.email,
        name: newUser.name,
        emailVerified: null
      }
    },
    
    async getUser(id) {
      const user = await getUserByEmail(id)
      if (!user) return null
      
      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        emailVerified: null
      }
    },

    async getUserByEmail(email) {
      const user = await getUserByEmail(email)
      if (!user) return null
      
      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        emailVerified: null
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      // Not used for credentials provider
      return null
    },

    async updateUser(user) {
      // Implement if needed
      return user
    },

    async deleteUser(userId) {
      // Implement if needed
    },

    async linkAccount(account) {
      // Not used for credentials provider
    },

    async unlinkAccount({ providerAccountId, provider }) {
      // Not used for credentials provider
    },

    async createSession({ sessionToken, userId, expires }) {
      await createSession(sessionToken, parseInt(userId), expires)
      return {
        sessionToken,
        userId,
        expires
      }
    },

    async getSessionAndUser(sessionToken) {
      const result = await getSessionAndUser(sessionToken)
      if (!result) return null

      const hasActiveSubscription = result.user.subscriptionStatus ? 
        isSubscriptionActive({
          status: result.user.subscriptionStatus,
          current_period_end: result.user.subscriptionEnd
        }) : false

      return {
        session: {
          sessionToken: result.session.sessionToken,
          userId: result.session.userId.toString(),
          expires: result.session.expires
        },
        user: {
          id: result.user.id.toString(),
          email: result.user.email,
          name: result.user.name,
          emailVerified: null,
          hasActiveSubscription
        }
      }
    },

    async updateSession({ sessionToken, expires }) {
      await updateSession(sessionToken, expires)
      return {
        sessionToken,
        expires
      }
    },

    async deleteSession(sessionToken) {
      await deleteSession(sessionToken)
    },

    async createVerificationToken({ identifier, expires, token }) {
      // Implement if needed for email verification
      return { identifier, expires, token }
    },

    async useVerificationToken({ identifier, token }) {
      // Implement if needed for email verification
      return null
    }
  },

  callbacks: {
    async session({ session, user, token }) {
      if (session?.user && user) {
        session.user.id = user.id
        session.user.hasActiveSubscription = (user as any).hasActiveSubscription || false
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