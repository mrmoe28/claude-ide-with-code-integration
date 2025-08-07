#!/usr/bin/env python3
"""
Terminal Diagnostics Script using Error Handler Agent
"""

import sys
import subprocess
import json
sys.path.append('.')

class ErrorType:
    COMPILATION = "compilation"
    RUNTIME = "runtime"
    DEPENDENCY = "dependency"
    SYNTAX = "syntax"
    NETWORK = "network"
    PERMISSION = "permission"
    CONFIGURATION = "configuration"

class ErrorContext:
    def __init__(self, error_message, error_type, file_path=None, line_number=None, 
                 stack_trace=None, language=None, framework=None):
        self.error_message = error_message
        self.error_type = error_type
        self.file_path = file_path
        self.line_number = line_number
        self.stack_trace = stack_trace
        self.language = language
        self.framework = framework

# Simplified Error Handler for this specific use case
class ErrorHandlerAgent:
    def __init__(self):
        self.solutions = {
            "node": [
                "Install Node.js from https://nodejs.org",
                "Check if Node.js is in your PATH: echo $PATH",
                "Restart terminal after installation",
                "Try using nvm to manage Node.js versions"
            ],
            "npm": [
                "Node.js installation includes npm",
                "Reinstall Node.js if npm is missing",
                "Check npm permissions: npm config get prefix",
                "Clear npm cache: npm cache clean --force"
            ],
            "port": [
                "Kill process using the port: lsof -ti:3000 | xargs kill -9",
                "Use a different port: npm run dev -- -p 3001",
                "Check for other services using the port",
                "Restart your computer to clear all processes"
            ],
            "permission": [
                "Fix npm permissions: sudo chown -R $(whoami) ~/.npm",
                "Use npx instead of global npm installs",
                "Check file permissions: ls -la",
                "Run with sudo if absolutely necessary (not recommended)"
            ],
            "dependency": [
                "Delete node_modules: rm -rf node_modules",
                "Clear npm cache: npm cache clean --force", 
                "Reinstall: npm install",
                "Check package.json for correct scripts"
            ]
        }
    
    def analyze_error(self, error_message, context=None):
        error_type = self._classify_error(error_message)
        return ErrorContext(error_message, error_type)
    
    def _classify_error(self, error_message):
        if "command not found" in error_message.lower() or "not found" in error_message.lower():
            return "dependency"
        elif "permission denied" in error_message.lower():
            return "permission" 
        elif "port" in error_message.lower() or "EADDRINUSE" in error_message:
            return "port"
        elif "npm" in error_message.lower():
            return "npm"
        elif "node" in error_message.lower():
            return "node"
        else:
            return "configuration"
    
    def generate_report(self, context):
        error_type = context.error_type
        solutions = self.solutions.get(error_type, ["Check error message and search for solutions online"])
        
        return {
            "error_analysis": {
                "type": error_type,
                "message": context.error_message,
                "location": {"file": context.file_path, "line": context.line_number},
                "context": {"language": context.language, "framework": context.framework}
            },
            "suggested_solutions": solutions,
            "next_steps": [
                "Apply suggested solutions in order",
                "Test each solution",
                "Document what works for future reference"
            ]
        }

def get_terminal_info():
    """Collect terminal and system information"""
    info = {
        "platform": subprocess.getoutput("uname -s"),
        "terminal": subprocess.getoutput("echo $TERM"),
        "shell": subprocess.getoutput("echo $SHELL"),
        "node_version": subprocess.getoutput("node --version 2>&1"),
        "npm_version": subprocess.getoutput("npm --version 2>&1"),
        "python_version": subprocess.getoutput("python3 --version 2>&1"),
        "pwd": subprocess.getoutput("pwd"),
        "which_node": subprocess.getoutput("which node 2>&1"),
        "which_npm": subprocess.getoutput("which npm 2>&1"),
        "path": subprocess.getoutput("echo $PATH"),
        "package_json_exists": subprocess.getoutput("ls -la package.json 2>&1"),
        "node_modules_exists": subprocess.getoutput("ls -la node_modules 2>&1"),
        "next_config": subprocess.getoutput("ls -la next.config.* 2>&1"),
        "processes": subprocess.getoutput("ps aux | grep -E '(node|npm|next)' | head -10")
    }
    return info

def check_common_terminal_issues():
    """Check for common terminal issues"""
    issues = []
    
    # Check if Node.js is installed
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
        if result.returncode != 0:
            issues.append(f"Node.js not working: {result.stderr}")
    except Exception as e:
        issues.append(f"Node.js not found or not executable: {str(e)}")
    
    # Check if npm is working
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True, timeout=5)
        if result.returncode != 0:
            issues.append(f"npm not working: {result.stderr}")
    except Exception as e:
        issues.append(f"npm not found or not executable: {str(e)}")
    
    # Check if we can run development server
    try:
        result = subprocess.run(["npm", "run", "dev", "--dry-run"], capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            issues.append(f"npm run dev not working: {result.stderr}")
    except Exception as e:
        issues.append(f"Cannot test npm run dev: {str(e)}")
    
    # Check for port conflicts
    try:
        result = subprocess.run(["lsof", "-i", ":3000"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            issues.append(f"Port 3000 is in use: {result.stdout}")
    except Exception as e:
        issues.append(f"Cannot check port 3000: {str(e)}")
    
    return issues

def main():
    print("🔍 Terminal Diagnostics Analysis")
    print("=" * 50)
    
    agent = ErrorHandlerAgent()
    
    # Collect system info
    print("\n📊 System Information:")
    info = get_terminal_info()
    for key, value in info.items():
        print(f"  {key}: {value}")
    
    # Check for common issues
    print("\n🔍 Checking for Common Issues:")
    issues = check_common_terminal_issues()
    
    if not issues:
        print("  ✅ No obvious terminal issues detected")
        return
    
    print(f"  ❌ Found {len(issues)} potential issues:")
    for i, issue in enumerate(issues, 1):
        print(f"    {i}. {issue}")
    
    # Analyze each issue with the agent
    print("\n🤖 AI Error Analysis:")
    for i, issue in enumerate(issues, 1):
        print(f"\n--- Issue {i} Analysis ---")
        context = agent.analyze_error(issue, {"system_info": info})
        report = agent.generate_report(context)
        
        print(f"Error Type: {report['error_analysis']['type']}")
        print(f"Location: {report['error_analysis']['location']}")
        print(f"Language/Framework: {report['error_analysis']['context']}")
        
        print("\nSuggested Solutions:")
        for j, solution in enumerate(report['suggested_solutions'], 1):
            print(f"  {j}. {solution}")
        
        print("\nNext Steps:")
        for j, step in enumerate(report['next_steps'], 1):
            print(f"  {j}. {step}")
    
    # Overall recommendations
    print("\n💡 Overall Recommendations:")
    print("1. Check if Node.js and npm are properly installed and in PATH")
    print("2. Verify package.json scripts are correctly defined")
    print("3. Ensure no processes are blocking required ports")
    print("4. Check for permission issues with node_modules")
    print("5. Try clearing npm cache: npm cache clean --force")
    print("6. Reinstall dependencies if needed: rm -rf node_modules && npm install")

if __name__ == "__main__":
    main()