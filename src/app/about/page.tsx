import packageJson from '../../../package.json'
import Link from 'next/link'

export default function AboutPage() {
  const buildTime = new Date().toISOString()
  
  return (
    <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Claude Code IDE
          </h1>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary">
            Professional IDE with Claude AI Integration
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              Version Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">Version:</span>
                <span className="text-light-text-primary dark:text-dark-text-primary font-mono">
                  {packageJson.version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">Build Time:</span>
                <span className="text-light-text-primary dark:text-dark-text-primary font-mono text-sm">
                  {buildTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">Next.js:</span>
                <span className="text-light-text-primary dark:text-dark-text-primary font-mono">
                  {packageJson.dependencies.next}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">React:</span>
                <span className="text-light-text-primary dark:text-dark-text-primary font-mono">
                  {packageJson.dependencies.react}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              Features
            </h2>
            <ul className="space-y-2 text-light-text-secondary dark:text-dark-text-secondary">
              <li>✓ Monaco Code Editor</li>
              <li>✓ Integrated Terminal</li>
              <li>✓ File Explorer</li>
              <li>✓ Claude AI Chat Integration</li>
              <li>✓ GitHub Integration</li>
              <li>✓ WebContainer Support</li>
              <li>✓ Authentication & Subscriptions</li>
            </ul>
          </div>
          
          <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              System Status
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">Environment:</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">
                  {process.env.NODE_ENV || 'development'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">Platform:</span>
                <span className="text-light-text-primary dark:text-dark-text-primary">
                  Vercel
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full text-center px-4 py-2 bg-light-accent-primary dark:bg-dark-accent-primary hover:bg-light-accent-focus dark:hover:bg-dark-accent-focus text-white rounded-md transition-colors duration-200"
              >
                Go to IDE
              </Link>
              <Link
                href="/auth/signin"
                className="block w-full text-center px-4 py-2 border border-light-accent-primary dark:border-dark-accent-primary text-light-accent-primary dark:text-dark-accent-primary hover:bg-light-accent-primary hover:text-white dark:hover:bg-dark-accent-primary dark:hover:text-white rounded-md transition-colors duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}