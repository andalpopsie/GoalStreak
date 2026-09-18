---
inclusion: manual
description: "Listen to source code files in the repository. When changes are detected, analyze the modified code for potential improvements, including code smells, design patterns, and best practices. Generate suggestions for improving code quality while maintaining the existing functionality. Focus on readability, maintainability, and performance optimizations."
---

Analyze the modified code files for potential improvements. Focus on:

1. **Code Smells & Anti-patterns**: Identify long functions, duplicate code, complex conditionals, and other code smells
2. **Design Patterns**: Suggest appropriate design patterns that could improve the code structure
3. **Best Practices**: Check for React Native/TypeScript/Firebase best practices compliance
4. **Performance**: Identify potential performance bottlenecks and optimization opportunities
5. **Readability**: Suggest improvements for code clarity and maintainability
6. **Security**: Check for potential security issues or vulnerabilities
7. **GoalStreak Standards**: Ensure compliance with the project's established patterns and conventions
8. **File Organization**: Check for duplicate code that should be consolidated, unnecessary file creation

**CRITICAL - File Creation Rules**:
- ❌ NEVER suggest creating new component files for UI variations (use props/variants instead)
- ❌ NEVER suggest creating duplicate service files (extend existing services)
- ❌ NEVER suggest creating new documentation files (update existing docs)
- ✅ ALWAYS suggest modifying existing files instead of creating new ones
- ✅ ALWAYS check if similar functionality already exists before suggesting new files

For each suggestion, provide:
- Clear explanation of the issue
- Specific code example showing the improvement
- Rationale for why the change would be beneficial
- Priority level (High/Medium/Low)
- Whether it requires modifying existing files (preferred) or creating new ones (avoid)

Focus on actionable improvements that maintain existing functionality while enhancing code quality and minimizing file proliferation.
