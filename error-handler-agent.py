#!/usr/bin/env python3
"""
Error Handling Agent - Intelligent error diagnosis and resolution system
"""

import re
import subprocess
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class ErrorType(Enum):
    COMPILATION = "compilation"
    RUNTIME = "runtime"
    DEPENDENCY = "dependency"
    SYNTAX = "syntax"
    NETWORK = "network"
    PERMISSION = "permission"
    CONFIGURATION = "configuration"

@dataclass
class ErrorContext:
    error_message: str
    error_type: ErrorType
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    stack_trace: Optional[str] = None
    language: Optional[str] = None
    framework: Optional[str] = None

class ErrorHandlerAgent:
    def __init__(self):
        self.error_patterns = {
            ErrorType.COMPILATION: [
                r"error: (.+)",
                r"fatal error: (.+)",
                r"undefined reference to (.+)",
                r"cannot find symbol (.+)"
            ],
            ErrorType.SYNTAX: [
                r"SyntaxError: (.+)",
                r"IndentationError: (.+)",
                r"unexpected token (.+)",
                r"missing semicolon"
            ],
            ErrorType.DEPENDENCY: [
                r"ModuleNotFoundError: (.+)",
                r"ImportError: (.+)",
                r"package (.+) not found",
                r"cannot resolve dependency (.+)"
            ],
            ErrorType.NETWORK: [
                r"connection refused",
                r"timeout",
                r"network unreachable",
                r"DNS resolution failed"
            ],
            ErrorType.PERMISSION: [
                r"permission denied",
                r"access forbidden",
                r"unauthorized",
                r"insufficient privileges"
            ]
        }
        
        self.solutions = {
            ErrorType.COMPILATION: self._handle_compilation_error,
            ErrorType.SYNTAX: self._handle_syntax_error,
            ErrorType.DEPENDENCY: self._handle_dependency_error,
            ErrorType.NETWORK: self._handle_network_error,
            ErrorType.PERMISSION: self._handle_permission_error
        }

    def analyze_error(self, error_message: str, context: Dict = None) -> ErrorContext:
        """Analyze error message and determine type and context"""
        error_type = self._classify_error(error_message)
        
        file_path, line_number = self._extract_location(error_message)
        language = self._detect_language(error_message, context)
        framework = self._detect_framework(error_message, context)
        
        return ErrorContext(
            error_message=error_message,
            error_type=error_type,
            file_path=file_path,
            line_number=line_number,
            language=language,
            framework=framework
        )

    def _classify_error(self, error_message: str) -> ErrorType:
        """Classify error based on patterns"""
        for error_type, patterns in self.error_patterns.items():
            for pattern in patterns:
                if re.search(pattern, error_message, re.IGNORECASE):
                    return error_type
        return ErrorType.RUNTIME

    def _extract_location(self, error_message: str) -> Tuple[Optional[str], Optional[int]]:
        """Extract file path and line number from error message"""
        # Common patterns for file:line references
        patterns = [
            r"([^\s:]+):(\d+):",
            r"File \"([^\"]+)\", line (\d+)",
            r"at ([^\s:]+):(\d+):"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, error_message)
            if match:
                return match.group(1), int(match.group(2))
        return None, None

    def _detect_language(self, error_message: str, context: Dict = None) -> Optional[str]:
        """Detect programming language from error patterns"""
        language_indicators = {
            'python': ['python', 'pip', 'traceback', 'modulenotfounderror'],
            'javascript': ['node', 'npm', 'webpack', 'unexpected token'],
            'java': ['java', 'javac', 'cannot find symbol', 'classnotfoundexception'],
            'swift': ['swift', 'xcode', 'cannot find in scope'],
            'c++': ['g++', 'clang++', 'undefined reference'],
            'rust': ['rustc', 'cargo', 'cannot find crate']
        }
        
        error_lower = error_message.lower()
        for lang, indicators in language_indicators.items():
            if any(indicator in error_lower for indicator in indicators):
                return lang
        return None

    def _detect_framework(self, error_message: str, context: Dict = None) -> Optional[str]:
        """Detect framework from error patterns"""
        framework_indicators = {
            'react': ['react', 'jsx', 'component'],
            'vue': ['vue', 'vue-cli'],
            'angular': ['angular', 'ng'],
            'django': ['django', 'manage.py'],
            'flask': ['flask', 'werkzeug'],
            'express': ['express', 'middleware']
        }
        
        error_lower = error_message.lower()
        for framework, indicators in framework_indicators.items():
            if any(indicator in error_lower for indicator in indicators):
                return framework
        return None

    def suggest_solution(self, error_context: ErrorContext) -> List[str]:
        """Generate solution suggestions based on error context"""
        handler = self.solutions.get(error_context.error_type)
        if handler:
            return handler(error_context)
        return ["Unable to determine specific solution. Please review error details."]

    def _handle_compilation_error(self, context: ErrorContext) -> List[str]:
        solutions = []
        if "undefined reference" in context.error_message:
            solutions.extend([
                "Check if all required libraries are linked",
                "Verify function declarations match implementations",
                "Ensure all object files are included in build"
            ])
        elif "cannot find symbol" in context.error_message:
            solutions.extend([
                "Check import statements and package declarations",
                "Verify class/method names are spelled correctly",
                "Ensure required dependencies are in classpath"
            ])
        else:
            solutions.append("Review compilation flags and include paths")
        return solutions

    def _handle_syntax_error(self, context: ErrorContext) -> List[str]:
        solutions = []
        if context.language == "python":
            solutions.extend([
                "Check indentation consistency (tabs vs spaces)",
                "Verify parentheses, brackets, and quotes are balanced",
                "Review syntax for Python version compatibility"
            ])
        elif context.language == "javascript":
            solutions.extend([
                "Check for missing semicolons or commas",
                "Verify bracket and parentheses matching",
                "Review variable declarations and scoping"
            ])
        return solutions

    def _handle_dependency_error(self, context: ErrorContext) -> List[str]:
        solutions = []
        if context.language == "python":
            solutions.extend([
                "Install missing package: pip install <package_name>",
                "Check virtual environment activation",
                "Verify PYTHONPATH includes module location"
            ])
        elif context.language == "javascript":
            solutions.extend([
                "Install missing package: npm install <package_name>",
                "Check package.json dependencies",
                "Clear npm cache: npm cache clean --force"
            ])
        return solutions

    def _handle_network_error(self, context: ErrorContext) -> List[str]:
        return [
            "Check internet connectivity",
            "Verify firewall settings",
            "Test with different network or VPN",
            "Check if service/API is accessible"
        ]

    def _handle_permission_error(self, context: ErrorContext) -> List[str]:
        return [
            "Run with appropriate permissions (sudo if needed)",
            "Check file/directory ownership and permissions",
            "Verify user has access to required resources",
            "Review security policies and access controls"
        ]

    def generate_report(self, error_context: ErrorContext) -> Dict:
        """Generate comprehensive error analysis report"""
        solutions = self.suggest_solution(error_context)
        
        return {
            "error_analysis": {
                "type": error_context.error_type.value,
                "message": error_context.error_message,
                "location": {
                    "file": error_context.file_path,
                    "line": error_context.line_number
                },
                "context": {
                    "language": error_context.language,
                    "framework": error_context.framework
                }
            },
            "suggested_solutions": solutions,
            "next_steps": [
                "Apply suggested solutions in order of likelihood",
                "Test each solution incrementally",
                "Document successful resolution for future reference"
            ]
        }

def main():
    agent = ErrorHandlerAgent()
    
    # Example usage
    error_msg = "ModuleNotFoundError: No module named 'requests'"
    context = agent.analyze_error(error_msg)
    report = agent.generate_report(context)
    
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()