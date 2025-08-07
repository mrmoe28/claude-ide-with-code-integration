# Claude Code + Cursor Integrated Workflow

## Overview
This setup optimizes Claude Code as your primary AI development assistant while using Cursor as a powerful visual editor and file browser.

## Configuration Summary
✅ Cursor AI features disabled (autocomplete, chat, composer)  
✅ Desktop Commander MCP built and ready  
✅ Specialized Python agents accessible  
✅ Optimal UI settings for dual-tool workflow  

## Primary Workflow Pattern

### 1. Development Tasks → Claude Code
**Use Claude Code for:**
- Complex multi-file refactoring
- Bug diagnosis and fixing
- Feature implementation 
- Code analysis and optimization
- Build/test/lint operations
- Git operations and commits
- Project-wide changes

**Commands:**
```bash
# Claude Code handles all AI-assisted development
claude code "implement user authentication"
claude code "fix the failing tests"
claude code "optimize this component for performance"
```

### 2. Visual Editing → Cursor
**Use Cursor for:**
- File navigation and browsing
- Manual code editing and review
- Visual diff inspection
- Terminal integration
- Quick file operations
- Code formatting and syntax highlighting

## Specialized Agents Integration

Located in `~/Desktop/CLAUDE AGENT/`:

```bash
# Error diagnosis
cd ~/Desktop/"CLAUDE AGENT" && python3 error-handler-agent.py

# Project planning
cd ~/Desktop/"CLAUDE AGENT" && python3 project-manager-agent.py

# UI design analysis  
cd ~/Desktop/"CLAUDE AGENT" && python3 ui-design-agent.py

# Technology evaluation
cd ~/Desktop/"CLAUDE AGENT" && python3 tech-stack-analyzer-agent.py

# iOS/macOS specific errors
cd ~/Desktop/"CLAUDE AGENT" && python3 xcode-error-handler-agent.py
```

## Optimal Development Flow

### Starting a New Task
1. **Claude Code**: Analyze requirements and create implementation plan
2. **Cursor**: Navigate to relevant files and review existing code
3. **Claude Code**: Execute implementation with real-time file updates
4. **Cursor**: Visual review of changes and manual tweaks if needed
5. **Claude Code**: Run tests, linting, and build processes

### Debugging Workflow
1. **Cursor**: Identify error location and gather context
2. **Claude Code**: Use error-handler agent for diagnosis
3. **Claude Code**: Implement fixes across multiple files
4. **Cursor**: Verify fixes visually and test manually
5. **Claude Code**: Run automated tests and validation

### Code Review Process  
1. **Claude Code**: Generate code changes
2. **Cursor**: Visual inspection and formatting review
3. **Claude Code**: Address any issues found
4. **Cursor**: Final approval and manual adjustments

## Key Benefits

### Claude Code Advantages
- **Superior reasoning**: Claude Sonnet 4 for complex problem-solving
- **Project awareness**: Reads CLAUDE.md files and understands context
- **Tool integration**: Direct access to terminal, git, build systems
- **Autonomous execution**: Can complete multi-step tasks without supervision
- **Specialized agents**: Expert knowledge for specific problem domains

### Cursor Advantages  
- **Visual excellence**: Superior file browsing and syntax highlighting
- **Fast navigation**: Quick file switching and project exploration
- **Manual precision**: Fine-grained control for detailed editing
- **UI responsiveness**: Immediate visual feedback on changes
- **Terminal integration**: Built-in terminal with good UX

## Best Practices

### Communication Between Tools
- Changes made by Claude Code appear immediately in Cursor
- Both tools respect file locks and git status
- Use Cursor for visual review after Claude Code operations
- Switch contexts fluidly based on task requirements

### Task Allocation Guidelines
- **Complex logic** → Claude Code
- **Visual inspection** → Cursor  
- **Bulk operations** → Claude Code
- **Precise editing** → Cursor
- **Automation** → Claude Code
- **Manual review** → Cursor

### Performance Tips
- Keep both tools open simultaneously
- Use Claude Code for file operations when changing many files
- Use Cursor for quick single-file edits
- Let Claude Code handle dependency management and builds
- Use Cursor's search when you know exactly what you're looking for

## Project-Specific Integration

Each project can have its own CLAUDE.md file with specific commands:

```markdown
# Project-specific CLAUDE.md example
## Development Commands
- Build: `npm run build`  
- Test: `npm test`
- Lint: `npm run lint`

## Architecture Notes
- Frontend: Next.js with App Router
- Database: PostgreSQL with Drizzle ORM
- Deployment: Vercel
```

## Troubleshooting

### If Cursor AI Features Re-enable
Check settings in: `/Users/ekodevapps/Library/Application Support/Cursor/User/settings.json`

### If Claude Code Loses Context
Ensure CLAUDE.md files are in project roots with proper guidance

### If Agents Aren't Accessible
Verify Python 3 is available and agents are in `~/Desktop/CLAUDE AGENT/`

---

This workflow maximizes the strengths of both tools while minimizing overlap and conflicts.