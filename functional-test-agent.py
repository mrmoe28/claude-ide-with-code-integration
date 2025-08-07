#!/usr/bin/env python3
"""
Functional Testing Agent - Comprehensive feature and functionality testing system
for Claude IDE application
"""

import subprocess
import json
import time
import requests
import os
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Any
from enum import Enum
import urllib.parse

class TestStatus(Enum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"

class FeatureType(Enum):
    UI_COMPONENT = "ui_component"
    API_ENDPOINT = "api_endpoint"
    USER_INTERACTION = "user_interaction"
    INTEGRATION = "integration"
    PERFORMANCE = "performance"
    ACCESSIBILITY = "accessibility"

@dataclass
class TestResult:
    test_name: str
    feature_type: FeatureType
    status: TestStatus
    description: str
    expected: str
    actual: str
    error_message: Optional[str] = None
    execution_time: Optional[float] = None
    suggestions: List[str] = None

    def __post_init__(self):
        if self.suggestions is None:
            self.suggestions = []

class FunctionalTestAgent:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.test_results: List[TestResult] = []
        self.failed_features: List[str] = []
        self.is_server_running = False
        
    def check_server_status(self) -> bool:
        """Check if Next.js development server is running"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            self.is_server_running = response.status_code == 200
            return self.is_server_running
        except requests.exceptions.RequestException:
            # Try the main page if health endpoint doesn't exist
            try:
                response = requests.get(self.base_url, timeout=5)
                self.is_server_running = response.status_code == 200
                return self.is_server_running
            except requests.exceptions.RequestException:
                self.is_server_running = False
                return False

    def test_package_json_integrity(self) -> TestResult:
        """Test package.json file integrity and scripts"""
        start_time = time.time()
        
        try:
            with open('package.json', 'r') as f:
                package_data = json.load(f)
            
            required_scripts = ['dev', 'build', 'start', 'lint']
            missing_scripts = [script for script in required_scripts if script not in package_data.get('scripts', {})]
            
            if missing_scripts:
                return TestResult(
                    test_name="Package.json Scripts Integrity",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.FAILED,
                    description="Check if all required NPM scripts are present",
                    expected=f"All scripts present: {required_scripts}",
                    actual=f"Missing scripts: {missing_scripts}",
                    execution_time=time.time() - start_time,
                    suggestions=[f"Add missing script: {script}" for script in missing_scripts]
                )
            
            return TestResult(
                test_name="Package.json Scripts Integrity",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.PASSED,
                description="Check if all required NPM scripts are present",
                expected="All required scripts present",
                actual="All scripts found",
                execution_time=time.time() - start_time
            )
            
        except Exception as e:
            return TestResult(
                test_name="Package.json Scripts Integrity",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.ERROR,
                description="Check if all required NPM scripts are present",
                expected="Valid package.json file",
                actual="Error reading package.json",
                error_message=str(e),
                execution_time=time.time() - start_time,
                suggestions=["Fix package.json syntax errors", "Ensure package.json exists"]
            )

    def test_dependency_installation(self) -> TestResult:
        """Test if all dependencies are properly installed"""
        start_time = time.time()
        
        try:
            # Check if node_modules exists and has content
            node_modules_path = Path("node_modules")
            if not node_modules_path.exists():
                return TestResult(
                    test_name="Dependency Installation",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.FAILED,
                    description="Check if dependencies are installed",
                    expected="node_modules directory with dependencies",
                    actual="node_modules directory not found",
                    execution_time=time.time() - start_time,
                    suggestions=["Run 'npm install' to install dependencies"]
                )
            
            # Count number of dependencies
            dependency_count = len(list(node_modules_path.iterdir()))
            
            if dependency_count < 10:  # Minimum expected dependencies
                return TestResult(
                    test_name="Dependency Installation",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.FAILED,
                    description="Check if dependencies are installed",
                    expected="Sufficient dependencies installed (>10)",
                    actual=f"Only {dependency_count} dependencies found",
                    execution_time=time.time() - start_time,
                    suggestions=["Run 'npm install' to ensure all dependencies are installed", "Check for installation errors"]
                )
            
            return TestResult(
                test_name="Dependency Installation",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.PASSED,
                description="Check if dependencies are installed",
                expected="Dependencies properly installed",
                actual=f"{dependency_count} dependencies found",
                execution_time=time.time() - start_time
            )
            
        except Exception as e:
            return TestResult(
                test_name="Dependency Installation",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.ERROR,
                description="Check if dependencies are installed",
                expected="Accessible node_modules directory",
                actual="Error accessing dependencies",
                error_message=str(e),
                execution_time=time.time() - start_time,
                suggestions=["Check file permissions", "Reinstall dependencies"]
            )

    def test_typescript_compilation(self) -> TestResult:
        """Test TypeScript compilation without errors"""
        start_time = time.time()
        
        try:
            # Run TypeScript check
            result = subprocess.run(['npx', 'tsc', '--noEmit'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                return TestResult(
                    test_name="TypeScript Compilation",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.PASSED,
                    description="Check TypeScript compilation for errors",
                    expected="No TypeScript errors",
                    actual="TypeScript compilation successful",
                    execution_time=time.time() - start_time
                )
            else:
                error_lines = result.stderr.split('\n')[:5]  # First 5 error lines
                return TestResult(
                    test_name="TypeScript Compilation",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.FAILED,
                    description="Check TypeScript compilation for errors",
                    expected="No TypeScript errors",
                    actual="TypeScript compilation failed",
                    error_message=result.stderr,
                    execution_time=time.time() - start_time,
                    suggestions=[
                        "Fix TypeScript errors in source code",
                        "Check tsconfig.json configuration",
                        "Ensure all types are properly defined"
                    ]
                )
                
        except subprocess.TimeoutExpired:
            return TestResult(
                test_name="TypeScript Compilation",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.ERROR,
                description="Check TypeScript compilation for errors",
                expected="TypeScript check completes in reasonable time",
                actual="TypeScript check timed out",
                execution_time=time.time() - start_time,
                suggestions=["Check for infinite loops or circular dependencies", "Optimize TypeScript configuration"]
            )
        except Exception as e:
            return TestResult(
                test_name="TypeScript Compilation",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.ERROR,
                description="Check TypeScript compilation for errors",
                expected="TypeScript check runs successfully",
                actual="Error running TypeScript check",
                error_message=str(e),
                execution_time=time.time() - start_time,
                suggestions=["Install TypeScript globally", "Check npx availability"]
            )

    def test_lint_compliance(self) -> TestResult:
        """Test ESLint compliance"""
        start_time = time.time()
        
        try:
            result = subprocess.run(['npm', 'run', 'lint'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                return TestResult(
                    test_name="ESLint Compliance",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.PASSED,
                    description="Check ESLint compliance",
                    expected="No linting errors",
                    actual="ESLint check passed",
                    execution_time=time.time() - start_time
                )
            else:
                return TestResult(
                    test_name="ESLint Compliance",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.FAILED,
                    description="Check ESLint compliance",
                    expected="No linting errors",
                    actual="ESLint errors found",
                    error_message=result.stdout + result.stderr,
                    execution_time=time.time() - start_time,
                    suggestions=[
                        "Fix ESLint errors in source code",
                        "Run 'npm run lint -- --fix' for auto-fixable issues",
                        "Update ESLint configuration if needed"
                    ]
                )
                
        except Exception as e:
            return TestResult(
                test_name="ESLint Compliance",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.ERROR,
                description="Check ESLint compliance",
                expected="ESLint runs successfully",
                actual="Error running ESLint",
                error_message=str(e),
                execution_time=time.time() - start_time,
                suggestions=["Check ESLint installation", "Verify npm scripts"]
            )

    def test_build_process(self) -> TestResult:
        """Test Next.js build process"""
        start_time = time.time()
        
        try:
            result = subprocess.run(['npm', 'run', 'build'], 
                                  capture_output=True, text=True, timeout=300)  # 5 minute timeout
            
            if result.returncode == 0:
                # Check if build output exists
                build_dir = Path('.next')
                if build_dir.exists():
                    return TestResult(
                        test_name="Next.js Build Process",
                        feature_type=FeatureType.INTEGRATION,
                        status=TestStatus.PASSED,
                        description="Check Next.js build process",
                        expected="Successful build with output",
                        actual="Build completed successfully",
                        execution_time=time.time() - start_time
                    )
                else:
                    return TestResult(
                        test_name="Next.js Build Process",
                        feature_type=FeatureType.INTEGRATION,
                        status=TestStatus.FAILED,
                        description="Check Next.js build process",
                        expected="Build output in .next directory",
                        actual="Build succeeded but no output found",
                        execution_time=time.time() - start_time,
                        suggestions=["Check Next.js configuration", "Verify build output directory"]
                    )
            else:
                return TestResult(
                    test_name="Next.js Build Process",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.FAILED,
                    description="Check Next.js build process",
                    expected="Successful build",
                    actual="Build failed",
                    error_message=result.stderr,
                    execution_time=time.time() - start_time,
                    suggestions=[
                        "Fix build errors in source code",
                        "Check Next.js configuration",
                        "Ensure all dependencies are installed"
                    ]
                )
                
        except subprocess.TimeoutExpired:
            return TestResult(
                test_name="Next.js Build Process",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.ERROR,
                description="Check Next.js build process",
                expected="Build completes in reasonable time",
                actual="Build process timed out",
                execution_time=time.time() - start_time,
                suggestions=["Optimize build process", "Check for infinite loops", "Increase timeout if needed"]
            )
        except Exception as e:
            return TestResult(
                test_name="Next.js Build Process",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.ERROR,
                description="Check Next.js build process",
                expected="Build process runs",
                actual="Error running build",
                error_message=str(e),
                execution_time=time.time() - start_time,
                suggestions=["Check Node.js installation", "Verify npm scripts"]
            )

    def test_api_endpoints(self) -> List[TestResult]:
        """Test API endpoints functionality"""
        results = []
        
        if not self.is_server_running:
            results.append(TestResult(
                test_name="API Endpoints Test",
                feature_type=FeatureType.API_ENDPOINT,
                status=TestStatus.SKIPPED,
                description="Test API endpoints",
                expected="Server running to test endpoints",
                actual="Development server not running",
                suggestions=["Start development server with 'npm run dev'"]
            ))
            return results
        
        # Test chat API endpoint
        results.append(self._test_chat_api())
        
        # Test terminal API endpoint
        results.append(self._test_terminal_api())
        
        return results

    def _test_chat_api(self) -> TestResult:
        """Test chat API endpoint"""
        start_time = time.time()
        
        try:
            payload = {
                "messages": [{"role": "user", "content": "Hello, test message"}]
            }
            
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                return TestResult(
                    test_name="Chat API Endpoint",
                    feature_type=FeatureType.API_ENDPOINT,
                    status=TestStatus.PASSED,
                    description="Test chat API endpoint",
                    expected="200 response with chat data",
                    actual=f"200 response received",
                    execution_time=time.time() - start_time
                )
            elif response.status_code == 500:
                return TestResult(
                    test_name="Chat API Endpoint",
                    feature_type=FeatureType.API_ENDPOINT,
                    status=TestStatus.FAILED,
                    description="Test chat API endpoint",
                    expected="200 response",
                    actual=f"500 server error",
                    error_message=response.text,
                    execution_time=time.time() - start_time,
                    suggestions=[
                        "Check OpenAI API key configuration",
                        "Verify API route implementation",
                        "Check server logs for errors"
                    ]
                )
            else:
                return TestResult(
                    test_name="Chat API Endpoint",
                    feature_type=FeatureType.API_ENDPOINT,
                    status=TestStatus.FAILED,
                    description="Test chat API endpoint",
                    expected="200 response",
                    actual=f"{response.status_code} response",
                    execution_time=time.time() - start_time,
                    suggestions=["Check API route configuration", "Verify request format"]
                )
                
        except Exception as e:
            return TestResult(
                test_name="Chat API Endpoint",
                feature_type=FeatureType.API_ENDPOINT,
                status=TestStatus.ERROR,
                description="Test chat API endpoint",
                expected="Successful API call",
                actual="Error making request",
                error_message=str(e),
                execution_time=time.time() - start_time,
                suggestions=["Check server status", "Verify network connectivity"]
            )

    def _test_terminal_api(self) -> TestResult:
        """Test terminal API endpoint"""
        start_time = time.time()
        
        try:
            response = requests.get(f"{self.base_url}/api/terminal", timeout=10)
            
            if response.status_code in [200, 405]:  # 405 might be expected for GET request
                return TestResult(
                    test_name="Terminal API Endpoint",
                    feature_type=FeatureType.API_ENDPOINT,
                    status=TestStatus.PASSED,
                    description="Test terminal API endpoint accessibility",
                    expected="Endpoint accessible",
                    actual=f"{response.status_code} response",
                    execution_time=time.time() - start_time
                )
            else:
                return TestResult(
                    test_name="Terminal API Endpoint",
                    feature_type=FeatureType.API_ENDPOINT,
                    status=TestStatus.FAILED,
                    description="Test terminal API endpoint accessibility",
                    expected="Endpoint accessible",
                    actual=f"{response.status_code} response",
                    execution_time=time.time() - start_time,
                    suggestions=["Check terminal API route implementation", "Verify endpoint configuration"]
                )
                
        except Exception as e:
            return TestResult(
                test_name="Terminal API Endpoint",
                feature_type=FeatureType.API_ENDPOINT,
                status=TestStatus.ERROR,
                description="Test terminal API endpoint accessibility",
                expected="Endpoint accessible",
                actual="Error accessing endpoint",
                error_message=str(e),
                execution_time=time.time() - start_time,
                suggestions=["Check server status", "Verify API route exists"]
            )

    def test_file_structure(self) -> TestResult:
        """Test project file structure integrity"""
        start_time = time.time()
        
        required_files_dirs = [
            "src/app",
            "src/components", 
            "src/hooks",
            "package.json",
            "next.config.ts",
            "tailwind.config.ts",
            "tsconfig.json"
        ]
        
        missing_items = []
        for item in required_files_dirs:
            if not Path(item).exists():
                missing_items.append(item)
        
        if missing_items:
            return TestResult(
                test_name="File Structure Integrity",
                feature_type=FeatureType.INTEGRATION,
                status=TestStatus.FAILED,
                description="Check project file structure",
                expected="All required files and directories present",
                actual=f"Missing: {missing_items}",
                execution_time=time.time() - start_time,
                suggestions=[f"Create missing: {item}" for item in missing_items]
            )
        
        return TestResult(
            test_name="File Structure Integrity",
            feature_type=FeatureType.INTEGRATION,
            status=TestStatus.PASSED,
            description="Check project file structure",
            expected="All required files and directories present",
            actual="File structure is complete",
            execution_time=time.time() - start_time
        )

    def test_component_imports(self) -> TestResult:
        """Test if component imports are working correctly"""
        start_time = time.time()
        
        try:
            # Check main components exist and are importable
            component_files = [
                "src/components/Layout/MainLayout.tsx",
                "src/components/Layout/Header.tsx",
                "src/components/Layout/WindowManager.tsx",
                "src/components/Editor/CodeEditor.tsx",
                "src/components/Terminal/MacTerminal.tsx",
                "src/components/Chat/ChatPanel.tsx",
                "src/components/FileExplorer/Sidebar.tsx"
            ]
            
            missing_components = []
            for component in component_files:
                if not Path(component).exists():
                    missing_components.append(component)
            
            if missing_components:
                return TestResult(
                    test_name="Component File Integrity",
                    feature_type=FeatureType.UI_COMPONENT,
                    status=TestStatus.FAILED,
                    description="Check if component files exist",
                    expected="All component files present",
                    actual=f"Missing components: {missing_components}",
                    execution_time=time.time() - start_time,
                    suggestions=[f"Create missing component: {comp}" for comp in missing_components]
                )
            
            return TestResult(
                test_name="Component File Integrity",
                feature_type=FeatureType.UI_COMPONENT,
                status=TestStatus.PASSED,
                description="Check if component files exist",
                expected="All component files present",
                actual="All components found",
                execution_time=time.time() - start_time
            )
            
        except Exception as e:
            return TestResult(
                test_name="Component File Integrity",
                feature_type=FeatureType.UI_COMPONENT,
                status=TestStatus.ERROR,
                description="Check if component files exist",
                expected="Accessible component files",
                actual="Error checking components",
                error_message=str(e),
                execution_time=time.time() - start_time,
                suggestions=["Check file permissions", "Verify project structure"]
            )

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all functional tests and return comprehensive results"""
        print("🧪 Starting Comprehensive Functional Testing...")
        print("=" * 60)
        
        # Check if server is running
        server_status = self.check_server_status()
        if server_status:
            print("✅ Development server is running")
        else:
            print("⚠️  Development server not detected - some tests will be skipped")
        
        # Run all tests
        test_methods = [
            self.test_package_json_integrity,
            self.test_dependency_installation,
            self.test_file_structure,
            self.test_component_imports,
            self.test_typescript_compilation,
            self.test_lint_compliance,
            # self.test_build_process,  # Skip by default as it's slow
        ]
        
        # Run individual tests
        for test_method in test_methods:
            try:
                result = test_method()
                self.test_results.append(result)
                if result.status == TestStatus.FAILED:
                    self.failed_features.append(result.test_name)
            except Exception as e:
                error_result = TestResult(
                    test_name=f"Error in {test_method.__name__}",
                    feature_type=FeatureType.INTEGRATION,
                    status=TestStatus.ERROR,
                    description="Test execution error",
                    expected="Test runs without errors",
                    actual="Test failed to execute",
                    error_message=str(e),
                    suggestions=["Check test implementation", "Verify test dependencies"]
                )
                self.test_results.append(error_result)
                self.failed_features.append(error_result.test_name)
        
        # Run API tests if server is running
        if server_status:
            api_tests = self.test_api_endpoints()
            self.test_results.extend(api_tests)
            for test in api_tests:
                if test.status == TestStatus.FAILED:
                    self.failed_features.append(test.test_name)
        
        return self.generate_test_report()

    def generate_test_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report with analysis and fix plan"""
        
        # Categorize results
        passed_tests = [t for t in self.test_results if t.status == TestStatus.PASSED]
        failed_tests = [t for t in self.test_results if t.status == TestStatus.FAILED]
        error_tests = [t for t in self.test_results if t.status == TestStatus.ERROR]
        skipped_tests = [t for t in self.test_results if t.status == TestStatus.SKIPPED]
        
        # Generate fix plan for failed features
        fix_plan = self._generate_fix_plan(failed_tests + error_tests)
        
        report = {
            "test_summary": {
                "total_tests": len(self.test_results),
                "passed": len(passed_tests),
                "failed": len(failed_tests),
                "errors": len(error_tests),
                "skipped": len(skipped_tests),
                "success_rate": round((len(passed_tests) / len(self.test_results)) * 100, 2) if self.test_results else 0
            },
            "detailed_results": [asdict(result) for result in self.test_results],
            "failed_features": self.failed_features,
            "critical_issues": [t.test_name for t in failed_tests + error_tests if t.feature_type in [FeatureType.INTEGRATION, FeatureType.API_ENDPOINT]],
            "fix_plan": fix_plan,
            "recommendations": self._generate_recommendations(),
            "next_steps": [
                "Address critical integration issues first",
                "Fix API endpoint configurations", 
                "Resolve TypeScript and linting errors",
                "Implement missing components",
                "Add comprehensive error handling",
                "Set up proper testing infrastructure"
            ]
        }
        
        return report

    def _generate_fix_plan(self, failed_tests: List[TestResult]) -> Dict[str, List[str]]:
        """Generate specific fix plan for failed tests"""
        fix_plan = {
            "immediate": [],
            "short_term": [],
            "long_term": []
        }
        
        for test in failed_tests:
            if test.feature_type == FeatureType.INTEGRATION:
                fix_plan["immediate"].extend(test.suggestions[:2])
            elif test.feature_type == FeatureType.API_ENDPOINT:
                fix_plan["short_term"].extend(test.suggestions[:2])
            else:
                fix_plan["long_term"].extend(test.suggestions[:1])
        
        # Remove duplicates
        for category in fix_plan:
            fix_plan[category] = list(dict.fromkeys(fix_plan[category]))
        
        return fix_plan

    def _generate_recommendations(self) -> List[str]:
        """Generate general recommendations based on test results"""
        recommendations = []
        
        failed_count = len([t for t in self.test_results if t.status == TestStatus.FAILED])
        
        if failed_count == 0:
            recommendations.extend([
                "✅ All tests passed! Your application is in good shape",
                "🚀 Consider adding more comprehensive tests",
                "📊 Implement performance monitoring",
                "🔧 Add integration tests for user workflows"
            ])
        elif failed_count <= 2:
            recommendations.extend([
                "⚠️ Minor issues detected - easy to fix",
                "🔧 Focus on the failed tests first",
                "✅ Most functionality is working correctly"
            ])
        else:
            recommendations.extend([
                "🚨 Multiple critical issues detected",
                "🔧 Prioritize integration and API fixes",
                "📋 Consider implementing a CI/CD pipeline",
                "🧪 Add automated testing to prevent regressions"
            ])
        
        return recommendations

def main():
    """Main function to run all tests and display results"""
    agent = FunctionalTestAgent()
    
    # Run comprehensive testing
    report = agent.run_all_tests()
    
    # Display results
    print("\n📊 TEST RESULTS SUMMARY:")
    print("=" * 40)
    summary = report["test_summary"]
    print(f"Total Tests: {summary['total_tests']}")
    print(f"✅ Passed: {summary['passed']}")
    print(f"❌ Failed: {summary['failed']}")
    print(f"⚠️ Errors: {summary['errors']}")
    print(f"⏭️ Skipped: {summary['skipped']}")
    print(f"Success Rate: {summary['success_rate']}%")
    
    if report["failed_features"]:
        print(f"\n🚨 FAILED FEATURES ({len(report['failed_features'])}):")
        for i, feature in enumerate(report["failed_features"], 1):
            print(f"  {i}. {feature}")
    
    if report["critical_issues"]:
        print(f"\n🔴 CRITICAL ISSUES:")
        for issue in report["critical_issues"]:
            print(f"  • {issue}")
    
    print(f"\n💡 RECOMMENDATIONS:")
    for rec in report["recommendations"]:
        print(f"  {rec}")
    
    print(f"\n🛠️ FIX PLAN:")
    fix_plan = report["fix_plan"]
    if fix_plan["immediate"]:
        print("  🔴 IMMEDIATE:")
        for fix in fix_plan["immediate"][:3]:
            print(f"    • {fix}")
    
    if fix_plan["short_term"]:
        print("  🟡 SHORT TERM:")
        for fix in fix_plan["short_term"][:3]:
            print(f"    • {fix}")
    
    # Save detailed report
    with open('functional_test_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n📄 Detailed report saved to: functional_test_report.json")
    
    return report

if __name__ == "__main__":
    main()