'use server'

import { sql } from '@vercel/postgres'

// Vercel Postgres connection with built-in pooling
// This approach is optimized for serverless functions
export { sql }

// Database initialization - create tables if they don't exist
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
        stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
        stripe_price_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'incomplete',
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create sessions table for NextAuth
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create accounts table for NextAuth (OAuth providers if needed)
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type VARCHAR(255),
        scope VARCHAR(255),
        id_token TEXT,
        session_state VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(provider, provider_account_id)
      );
    `

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// User operations optimized for Vercel Postgres
export async function createUser(email: string, password: string, name?: string) {
  try {
    const result = await sql`
      INSERT INTO users (email, password, name)
      VALUES (${email}, ${password}, ${name || null})
      RETURNING id, email, name, created_at;
    `
    return result.rows[0]
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await sql`
      SELECT u.*, s.status as subscription_status, s.current_period_end
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.email = ${email};
    `
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting user by email:', error)
    throw error
  }
}

export async function getUserById(id: number) {
  try {
    const result = await sql`
      SELECT u.*, s.status as subscription_status, s.current_period_end
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = ${id};
    `
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting user by id:', error)
    throw error
  }
}

// Subscription operations
export async function createSubscription(
  userId: number,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  status: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
) {
  try {
    const result = await sql`
      INSERT INTO subscriptions (
        user_id, stripe_customer_id, stripe_subscription_id, 
        stripe_price_id, status, current_period_start, current_period_end
      )
      VALUES (
        ${userId}, ${stripeCustomerId}, ${stripeSubscriptionId},
        ${stripePriceId}, ${status}, ${currentPeriodStart.toISOString()}, ${currentPeriodEnd.toISOString()}
      )
      ON CONFLICT (stripe_subscription_id) 
      DO UPDATE SET 
        status = ${status},
        current_period_start = ${currentPeriodStart.toISOString()},
        current_period_end = ${currentPeriodEnd.toISOString()},
        updated_at = NOW()
      RETURNING *;
    `
    return result.rows[0]
  } catch (error) {
    console.error('Error creating/updating subscription:', error)
    throw error
  }
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd?: Date
) {
  try {
    const updateFields = [
      `status = '${status}'`,
      `updated_at = NOW()`
    ]
    
    if (currentPeriodEnd) {
      updateFields.push(`current_period_end = '${currentPeriodEnd.toISOString()}'`)
    }

    const result = await sql`
      UPDATE subscriptions 
      SET status = ${status}, 
          current_period_end = ${currentPeriodEnd ? currentPeriodEnd.toISOString() : sql`current_period_end`},
          updated_at = NOW()
      WHERE stripe_subscription_id = ${stripeSubscriptionId}
      RETURNING *;
    `
    return result.rows[0]
  } catch (error) {
    console.error('Error updating subscription status:', error)
    throw error
  }
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  try {
    const result = await sql`
      SELECT s.*, u.email as user_email
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.stripe_subscription_id = ${stripeSubscriptionId};
    `
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting subscription by stripe id:', error)
    throw error
  }
}

export async function getSubscriptionByCustomerId(stripeCustomerId: string) {
  try {
    const result = await sql`
      SELECT s.*, u.email as user_email
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.stripe_customer_id = ${stripeCustomerId};
    `
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting subscription by customer id:', error)
    throw error
  }
}

// Session management for NextAuth
export async function createSession(sessionToken: string, userId: number, expires: Date) {
  try {
    const result = await sql`
      INSERT INTO sessions (session_token, user_id, expires)
      VALUES (${sessionToken}, ${userId}, ${expires.toISOString()})
      RETURNING *;
    `
    return result.rows[0]
  } catch (error) {
    console.error('Error creating session:', error)
    throw error
  }
}

export async function getSessionAndUser(sessionToken: string) {
  try {
    const result = await sql`
      SELECT 
        s.id as session_id, s.session_token, s.expires,
        u.id as user_id, u.email, u.name,
        sub.status as subscription_status, sub.current_period_end
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN subscriptions sub ON u.id = sub.user_id
      WHERE s.session_token = ${sessionToken} AND s.expires > NOW();
    `
    
    if (!result.rows[0]) return null
    
    const row = result.rows[0]
    return {
      session: {
        id: row.session_id,
        sessionToken: row.session_token,
        userId: row.user_id,
        expires: new Date(row.expires)
      },
      user: {
        id: row.user_id,
        email: row.email,
        name: row.name,
        subscriptionStatus: row.subscription_status,
        subscriptionEnd: row.current_period_end ? new Date(row.current_period_end) : null
      }
    }
  } catch (error) {
    console.error('Error getting session and user:', error)
    throw error
  }
}

export async function updateSession(sessionToken: string, expires: Date) {
  try {
    const result = await sql`
      UPDATE sessions 
      SET expires = ${expires.toISOString()}
      WHERE session_token = ${sessionToken}
      RETURNING *;
    `
    return result.rows[0]
  } catch (error) {
    console.error('Error updating session:', error)
    throw error
  }
}

export async function deleteSession(sessionToken: string) {
  try {
    await sql`
      DELETE FROM sessions 
      WHERE session_token = ${sessionToken};
    `
  } catch (error) {
    console.error('Error deleting session:', error)
    throw error
  }
}