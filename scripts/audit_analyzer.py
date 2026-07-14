import os
import ast
import re
import json

IGNORE_DIRS = {'node_modules', 'venv', '.git', '__pycache__', '.pytest_cache', 'dist', 'build', '.next'}
TARGET_DIRS = {'backend', 'bot', 'admin', 'webapp', 'shared', 'scripts'}

SECRET_REGEX = re.compile(r'(?i)(password|secret|token|api[_-]?key|jwt|auth).{0,5}=.{0,5}(["\'][a-zA-Z0-9\-_]{5,}["\'])')

class PythonAnalyzer(ast.NodeVisitor):
    def __init__(self, filepath):
        self.filepath = filepath
        self.issues = []
        
    def visit_FunctionDef(self, node):
        if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
            length = node.end_lineno - node.lineno
            if length > 50:
                self.issues.append(f"Line {node.lineno}: Function '{node.name}' is too long ({length} lines) - consider refactoring.")
        self.generic_visit(node)
        
    def visit_ExceptHandler(self, node):
        if node.type is None:
            self.issues.append(f"Line {node.lineno}: Bare except (except:) used - catch specific exceptions.")
        elif isinstance(node.type, ast.Name) and node.type.id == 'Exception':
            self.issues.append(f"Line {node.lineno}: Catching generic Exception - be more specific if possible.")
        self.generic_visit(node)
        
    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            if node.func.id in ('eval', 'exec'):
                self.issues.append(f"Line {node.lineno}: Avoid using '{node.func.id}()' - serious security risk.")
        self.generic_visit(node)

def analyze_python_file(filepath):
    issues = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.splitlines()
    except Exception as e:
        return [f"Failed to read file: {e}"]
        
    if len(lines) > 400:
        issues.append(f"File is quite large ({len(lines)} lines) - consider splitting logic into smaller modules.")
        
    try:
        tree = ast.parse(content)
        analyzer = PythonAnalyzer(filepath)
        analyzer.visit(tree)
        issues.extend(analyzer.issues)
    except SyntaxError as e:
        issues.append(f"Syntax error at line {e.lineno}: {e.msg}")
        
    for i, line in enumerate(lines, 1):
        if SECRET_REGEX.search(line):
            issues.append(f"Line {i}: Potential hardcoded secret or token detected.")
            
    return issues

def analyze_ts_js_file(filepath):
    issues = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return [f"Failed to read file: {e}"]
        
    if len(lines) > 400:
        issues.append(f"File is quite large ({len(lines)} lines) - consider component composition and custom hooks.")
        
    any_count = 0
    console_count = 0
    for i, line in enumerate(lines, 1):
        if re.search(r'\bany\b', line):
            any_count += 1
        if 'console.log' in line:
            console_count += 1
        if SECRET_REGEX.search(line):
            issues.append(f"Line {i}: Potential hardcoded secret or token detected.")
            
    if any_count > 0:
        issues.append(f"Found {any_count} usages of 'any' type - try to use strict typing.")
    if console_count > 0:
        issues.append(f"Found {console_count} usages of 'console.log' - remove before production.")
        
    return issues

def generate_report(project_root):
    report_data = {}
    
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        # Only process target directories
        rel_root = os.path.relpath(root, project_root)
        top_level_dir = rel_root.split(os.sep)[0]
        if top_level_dir not in TARGET_DIRS and top_level_dir != '.':
            continue

        for file in files:
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, project_root)
            
            issues = []
            if file.endswith('.py'):
                issues = analyze_python_file(filepath)
            elif file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                issues = analyze_ts_js_file(filepath)
                
            if issues:
                report_data[rel_path] = issues
                
    return report_data

if __name__ == '__main__':
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print(f"Scanning project root: {project_root}")
    results = generate_report(project_root)
    
    report_path = os.path.join(project_root, 'audit_analyzer_report.md')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# Project Audit Automated Findings\n\n")
        if not results:
            f.write("No major issues found by the automated scanner!\n")
        else:
            for file, issues in results.items():
                f.write(f"### `{file}`\n")
                for issue in issues:
                    f.write(f"- {issue}\n")
                f.write("\n")
                
    print(f"Audit complete. Report generated at {report_path}")
