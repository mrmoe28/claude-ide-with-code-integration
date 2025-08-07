import { NextRequest } from 'next/server'
import { spawn, execSync } from 'child_process'
import { platform } from 'os'

// Check if Claude CLI is installed
const checkClaudeInstallation = (): { installed: boolean; path?: string; error?: string } => {
  try {
    const claudePath = execSync('which claude', { encoding: 'utf8' }).trim()
    return { installed: true, path: claudePath }
  } catch (error) {
    // Check common paths
    const commonPaths = [
      '/Users/ekodevapps/.nvm/versions/node/v24.4.1/bin/claude',
      '/usr/local/bin/claude',
      '/opt/homebrew/bin/claude',
      process.env.HOME + '/.npm-global/bin/claude',
      process.env.HOME + '/.local/bin/claude'
    ]
    
    for (const path of commonPaths) {
      try {
        execSync(`test -f "${path}"`, { stdio: 'ignore' })
        return { installed: true, path }
      } catch {
        continue
      }
    }
    
    return { 
      installed: false, 
      error: 'Claude CLI not found in PATH or common installation directories' 
    }
  }
}

// Get npm/node information
const getNpmInfo = () => {
  try {
    const npmPath = execSync('which npm', { encoding: 'utf8' }).trim()
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
    const globalPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim()
    
    return {
      npmPath,
      npmVersion,
      nodeVersion,
      globalPrefix,
      available: true
    }
  } catch (error) {
    return {
      available: false,
      error: 'npm not found or not accessible'
    }
  }
}

// Install Claude CLI
const installClaudeCLI = (): Promise<{ success: boolean; output?: string; error?: string }> => {
  return new Promise((resolve) => {
    const installCommand = 'npm'
    const installArgs = ['install', '-g', '@anthropic-ai/claude']
    
    const installProcess = spawn(installCommand, installArgs, {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin'
      }
    })
    
    let output = ''
    let errorOutput = ''
    
    installProcess.stdout?.on('data', (data) => {
      output += data.toString()
    })
    
    installProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ 
          success: true, 
          output: output || 'Claude CLI installed successfully' 
        })
      } else {
        resolve({ 
          success: false, 
          error: errorOutput || `Installation failed with exit code ${code}` 
        })
      }
    })
    
    installProcess.on('error', (error) => {
      resolve({ 
        success: false, 
        error: `Failed to start installation: ${error.message}` 
      })
    })
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'check') {
      // Check installation status
      const claudeStatus = checkClaudeInstallation()
      const npmInfo = getNpmInfo()
      
      return new Response(JSON.stringify({
        claude: claudeStatus,
        npm: npmInfo,
        system: {
          platform: platform(),
          arch: process.arch,
          nodeVersion: process.version
        },
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Default: return setup information
    const claudeStatus = checkClaudeInstallation()
    
    return new Response(JSON.stringify({
      installed: claudeStatus.installed,
      path: claudeStatus.path,
      canInstall: getNpmInfo().available,
      instructions: {
        automatic: 'POST /api/setup-claude with action=install',
        manual: 'npm install -g @anthropic-ai/claude'
      },
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Setup check error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to check Claude CLI setup',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'install') {
      // Check if already installed
      const claudeStatus = checkClaudeInstallation()
      if (claudeStatus.installed) {
        return new Response(JSON.stringify({
          message: 'Claude CLI is already installed',
          path: claudeStatus.path,
          success: true,
          alreadyInstalled: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Check if npm is available
      const npmInfo = getNpmInfo()
      if (!npmInfo.available) {
        return new Response(JSON.stringify({
          error: 'npm is not available for automatic installation',
          message: 'Please install npm first or install Claude CLI manually',
          manualCommand: 'npm install -g @anthropic-ai/claude',
          success: false
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Attempt installation
      const installResult = await installClaudeCLI()
      
      if (installResult.success) {
        // Verify installation
        const verifyStatus = checkClaudeInstallation()
        
        return new Response(JSON.stringify({
          message: 'Claude CLI installed successfully',
          output: installResult.output,
          path: verifyStatus.path,
          verified: verifyStatus.installed,
          success: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      } else {
        return new Response(JSON.stringify({
          error: 'Failed to install Claude CLI',
          message: installResult.error,
          suggestion: 'Try installing manually: npm install -g @anthropic-ai/claude',
          success: false
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    return new Response(JSON.stringify({
      error: 'Invalid action',
      message: 'Supported actions: install',
      success: false
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Setup installation error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to process setup request',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}