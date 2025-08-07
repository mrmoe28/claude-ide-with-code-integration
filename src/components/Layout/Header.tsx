'use client'

import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon, LogOut, User, Settings, Sidebar, MessageSquare, Terminal, Code, HelpCircle } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  showSidebar?: boolean
  showTerminal?: boolean
  showChat?: boolean
  claudeCodeMode?: boolean
  terminalType?: 'mac' | 'webcontainer'
  onToggleSidebar?: () => void
  onToggleTerminal?: () => void
  onToggleChat?: () => void
}

export function Header({ 
  showSidebar = true, 
  showTerminal = false, 
  showChat = true,
  claudeCodeMode = false,
  terminalType = 'mac',
  onToggleSidebar,
  onToggleTerminal,
  onToggleChat
}: HeaderProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  return (
    <header className="h-12 w-full bg-light-bg-primary dark:bg-dark-bg-primary 
                     border-b border-light-border-primary dark:border-dark-border-primary
                     flex items-center justify-between px-4">
      {/* Left Section - Logo and Window Toggles */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-light-accent-primary dark:bg-dark-accent-primary rounded-sm flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <h1 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
            Claude Code IDE
          </h1>
        </div>

        {/* Window Toggle Controls */}
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors ${
              showSidebar ? 'bg-blue-100 dark:bg-blue-900' : ''
            }`}
            title="Toggle File Explorer (⌘B)"
          >
            <Sidebar size={16} className="text-light-text-muted dark:text-dark-text-muted" />
          </button>
          
          <button
            onClick={onToggleTerminal}
            className={`relative p-1.5 rounded hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors ${
              showTerminal ? 'bg-blue-100 dark:bg-blue-900' : ''
            }`}
            title={`Toggle Terminal (⌘J)${terminalType === 'mac' && showTerminal ? ' - Claude Code Ready' : ''}`}
          >
            <Terminal size={16} className={`${terminalType === 'mac' && showTerminal ? 'text-green-600 dark:text-green-400' : 'text-light-text-muted dark:text-dark-text-muted'}`} />
            {terminalType === 'mac' && showTerminal && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
          
          <button
            onClick={onToggleChat}
            className={`p-1.5 rounded hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors ${
              showChat ? 'bg-blue-100 dark:bg-blue-900' : ''
            }`}
            title={`Toggle AI Assistant (⌘⇧C)${claudeCodeMode ? ' - Claude Code Mode' : ''}`}
          >
            <MessageSquare size={16} className="text-light-text-muted dark:text-dark-text-muted" />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Keyboard Shortcuts Helper */}
        <div className="relative">
          <button
            onClick={() => setShortcutsOpen(!shortcutsOpen)}
            className="p-2 rounded-md hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                     text-light-text-secondary dark:text-dark-text-secondary
                     hover:text-light-text-primary dark:hover:text-dark-text-primary
                     transition-colors duration-150"
            title="Keyboard Shortcuts"
          >
            <HelpCircle size={16} />
          </button>
          
          {shortcutsOpen && (
            <>
              <div className="absolute right-0 mt-1 w-64 z-50
                            bg-light-bg-primary dark:bg-dark-bg-primary
                            border border-light-border-primary dark:border-dark-border-primary
                            rounded-md shadow-lg py-2">
                <div className="px-3 py-2 border-b border-light-border-primary dark:border-dark-border-primary">
                  <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <div className="px-3 py-2 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">File Explorer</span>
                    <kbd className="px-1 py-0.5 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded border">⌘B</kbd>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">Terminal</span>
                    <kbd className="px-1 py-0.5 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded border">⌘J</kbd>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">AI Assistant</span>
                    <kbd className="px-1 py-0.5 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded border">⌘⇧C</kbd>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-1">
                      <Code size={10} />
                      Claude Code Mode
                    </span>
                    <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded border">⌘K</kbd>
                  </div>
                </div>
              </div>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShortcutsOpen(false)}
              />
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                   text-light-text-secondary dark:text-dark-text-secondary
                   hover:text-light-text-primary dark:hover:text-dark-text-primary
                   transition-colors duration-150"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-md 
                       hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                       text-light-text-primary dark:text-dark-text-primary
                       transition-colors duration-150"
            >
              <div className="w-6 h-6 bg-light-accent-primary dark:bg-dark-accent-primary 
                            rounded-full flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {user.name || user.email}
              </span>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div className="absolute right-0 mt-1 w-48 z-50
                              bg-light-bg-primary dark:bg-dark-bg-primary
                              border border-light-border-primary dark:border-dark-border-primary
                              rounded-md shadow-lg py-1">
                  <div className="px-3 py-2 border-b border-light-border-primary dark:border-dark-border-primary">
                    <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {user.hasActiveSubscription ? 'Pro Member' : 'Free User'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      // Add settings functionality here
                    }}
                    className="w-full px-3 py-2 text-left text-sm
                             text-light-text-primary dark:text-dark-text-primary
                             hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                             flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Settings
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut()
                    }}
                    className="w-full px-3 py-2 text-left text-sm
                             text-red-600 dark:text-red-400
                             hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                             flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>

                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
              </>
            )}
          </div>
        ) : (
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Not signed in
          </div>
        )}
      </div>
    </header>
  )
}