'use client'

import { WebContainer } from '@webcontainer/api'

export class WebContainerService {
  private static instance: WebContainerService | null = null
  private webcontainer: WebContainer | null = null
  private isBooting = false

  private constructor() {}

  static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService()
    }
    return WebContainerService.instance
  }

  async boot(): Promise<WebContainer> {
    if (this.webcontainer) {
      return this.webcontainer
    }

    if (this.isBooting) {
      // Wait for the current boot process to complete
      while (this.isBooting) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if (this.webcontainer) {
        return this.webcontainer
      }
    }

    this.isBooting = true

    try {
      // Boot WebContainer
      this.webcontainer = await WebContainer.boot()
      
      // Mount initial file system
      await this.webcontainer.mount({
        'package.json': {
          file: {
            contents: JSON.stringify({
              "name": "claude-ide-workspace",
              "version": "1.0.0",
              "description": "Claude IDE WebContainer workspace",
              "scripts": {
                "dev": "echo 'Development server not configured'",
                "build": "echo 'Build script not configured'",
                "test": "echo 'No tests configured'"
              },
              "dependencies": {}
            }, null, 2)
          }
        },
        'README.md': {
          file: {
            contents: `# Claude IDE Workspace

Welcome to your Claude IDE workspace! This is a fully functional terminal environment running in your browser.

## Available Commands
- \`ls\` - List files
- \`cat <file>\` - View file contents
- \`echo <text>\` - Print text
- \`mkdir <dir>\` - Create directory
- \`cd <dir>\` - Change directory
- \`npm init\` - Initialize a new project
- \`npm install <package>\` - Install packages
- \`node <file>\` - Run Node.js files

## Getting Started
Try running some basic commands to explore the environment!
`
          }
        }
      })

      this.isBooting = false
      return this.webcontainer
    } catch (error) {
      this.isBooting = false
      console.error('Failed to boot WebContainer:', error)
      throw error
    }
  }

  getWebContainer(): WebContainer | null {
    return this.webcontainer
  }
}