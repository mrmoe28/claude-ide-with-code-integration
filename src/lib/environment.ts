/**
 * Environment detection utilities for different deployment contexts
 */

export const isVercelProduction = () => {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'
}

export const isVercelPreview = () => {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview'
}

export const isVercel = () => {
  return process.env.VERCEL === '1'
}

export const isLocal = () => {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL
}

export const isServerless = () => {
  return isVercel() || process.env.LAMBDA_TASK_ROOT !== undefined
}

export const getEnvironmentInfo = () => {
  return {
    isLocal: isLocal(),
    isVercel: isVercel(),
    isVercelProduction: isVercelProduction(),
    isVercelPreview: isVercelPreview(),
    isServerless: isServerless(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  }
}

export const shouldUseWebContainer = () => {
  // Use WebContainer in serverless environments or when node-pty is not available
  return isServerless() || typeof window !== 'undefined'
}

export const shouldUseNodePty = () => {
  // Use node-pty only in local development with Node.js backend
  return isLocal() && typeof window === 'undefined'
}