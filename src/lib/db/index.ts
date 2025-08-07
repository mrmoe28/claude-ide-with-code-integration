import { sql } from '@vercel/postgres'
import { NextRequest } from 'next/server'

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  email_verified?: Date
  created_at: Date
  updated_at: Date
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'unpaid'
  current_period_start?: Date
  current_period_end?: Date
  cancel_at_period_end: boolean
  created_at: Date
  updated_at: Date
}

export interface UsageLog {
  id: number
  user_id: string
  action: string
  details?: any
  created_at: Date
}

// Database utility functions
export const db = {
  // User operations
  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT * FROM users WHERE id = ${id}
      `
      return (result.rows[0] as User) || null
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT * FROM users WHERE email = ${email}
      `
      return (result.rows[0] as User) || null
    } catch (error) {
      console.error('Error getting user by email:', error)
      return null
    }
  },

      async createUser(user: Omit<User, 'created_at' | 'updated_at'>): Promise<User | null> {
      try {
        const result = await sql`
          INSERT INTO users (id, email, name, image, email_verified)
          VALUES (${user.id}, ${user.email}, ${user.name}, ${user.image}, ${user.email_verified ? user.email_verified.toISOString() : null})
          RETURNING *
        `
        return (result.rows[0] as User) || null
      } catch (error) {
        console.error('Error creating user:', error)
        return null
      }
    },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const fields = Object.keys(updates).filter(key => key !== 'id')
      const values = Object.values(updates).filter((_, index) => fields[index] !== 'id')
      
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
      const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`
      
      const result = await sql.query(query, [id, ...values])
      return (result.rows[0] as User) || null
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  },

  // Subscription operations
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    try {
      const result = await sql`
        SELECT * FROM subscriptions WHERE user_id = ${userId}
      `
      return (result.rows[0] as Subscription) || null
    } catch (error) {
      console.error('Error getting subscription by user ID:', error)
      return null
    }
  },

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    try {
      const result = await sql`
        SELECT * FROM subscriptions WHERE stripe_subscription_id = ${stripeSubscriptionId}
      `
      return (result.rows[0] as Subscription) || null
    } catch (error) {
      console.error('Error getting subscription by Stripe ID:', error)
      return null
    }
  },

  async createSubscription(subscription: Omit<Subscription, 'created_at' | 'updated_at'>): Promise<Subscription | null> {
    try {
      const result = await sql`
        INSERT INTO subscriptions (
          id, user_id, stripe_customer_id, stripe_subscription_id, 
          stripe_price_id, status, current_period_start, current_period_end, 
          cancel_at_period_end
        )
        VALUES (
          ${subscription.id}, ${subscription.user_id}, ${subscription.stripe_customer_id},
          ${subscription.stripe_subscription_id}, ${subscription.stripe_price_id},
          ${subscription.status}, ${subscription.current_period_start ? subscription.current_period_start.toISOString() : null},
          ${subscription.current_period_end ? subscription.current_period_end.toISOString() : null}, ${subscription.cancel_at_period_end}
        )
        RETURNING *
      `
      return (result.rows[0] as Subscription) || null
    } catch (error) {
      console.error('Error creating subscription:', error)
      return null
    }
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    try {
      const fields = Object.keys(updates).filter(key => key !== 'id')
      const values = Object.values(updates).filter((_, index) => fields[index] !== 'id')
      
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
      const query = `UPDATE subscriptions SET ${setClause} WHERE id = $1 RETURNING *`
      
      const result = await sql.query(query, [id, ...values])
      return (result.rows[0] as Subscription) || null
    } catch (error) {
      console.error('Error updating subscription:', error)
      return null
    }
  },

  // Usage tracking
  async logUsage(userId: string, action: string, details?: any): Promise<UsageLog | null> {
    try {
      const result = await sql`
        INSERT INTO usage_logs (user_id, action, details)
        VALUES (${userId}, ${action}, ${details ? JSON.stringify(details) : null})
        RETURNING *
      `
      return (result.rows[0] as UsageLog) || null
    } catch (error) {
      console.error('Error logging usage:', error)
      return null
    }
  },

  async getUsageStats(userId: string, days: number = 30): Promise<any[]> {
    try {
      const result = await sql`
        SELECT action, COUNT(*) as count, DATE(created_at) as date
        FROM usage_logs 
        WHERE user_id = ${userId} 
        AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY action, DATE(created_at)
        ORDER BY date DESC, count DESC
      `
      return result.rows
    } catch (error) {
      console.error('Error getting usage stats:', error)
      return []
    }
  },

  // Database initialization
  async initializeDatabase(): Promise<boolean> {
    try {
      // Read and execute schema
      const fs = require('fs')
      const path = require('path')
      const schemaPath = path.join(process.cwd(), 'src/lib/db/schema.sql')
      const schema = fs.readFileSync(schemaPath, 'utf8')
      
      // Split by semicolon and execute each statement
      const statements = schema.split(';').filter((stmt: string) => stmt.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          await sql.query(statement)
        }
      }
      
      console.log('Database initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing database:', error)
      return false
    }
  }
}

// Helper function to check if user has active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscription = await db.getSubscriptionByUserId(userId)
    return subscription?.status === 'active' && 
           (!subscription.current_period_end || new Date() < subscription.current_period_end)
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return false
  }
}

// Helper function to get subscription status
export async function getSubscriptionStatus(userId: string): Promise<'active' | 'inactive' | 'past_due' | 'canceled' | 'unpaid' | null> {
  try {
    const subscription = await db.getSubscriptionByUserId(userId)
    return subscription?.status || null
  } catch (error) {
    console.error('Error getting subscription status:', error)
    return null
  }
}
