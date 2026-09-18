---
inclusion: manual
description: "Monitors all TypeScript/JavaScript source files, configuration files, and other relevant project files for changes. When changes are detected, triggers documentation updates in the /docs folder to keep documentation synchronized with the current codebase state."
---

Source files have been modified in the GoalStreak project. Please analyze the changes and update the relevant documentation. Focus on:

1. **Architecture changes**: Update existing architecture docs if component structure, services, or data models changed
2. **Development updates**: Update existing development guides if build process, dependencies, or setup instructions changed  
3. **API/Service changes**: Document any new services, hooks, or utilities in existing documentation
4. **Feature documentation**: Update existing feature-specific docs if new functionality was added
5. **Configuration changes**: Document any changes to Firebase, Expo, or other configuration files in existing docs
6. **CHANGELOG updates**: Add incremental changes to CHANGELOG.md instead of creating new summary files

**CRITICAL - Documentation Rules**:
- ❌ NEVER create new summary or report files for recent changes
- ❌ NEVER create duplicate documentation files
- ✅ ALWAYS update existing documentation files
- ✅ ALWAYS use CHANGELOG.md for incremental updates
- ✅ ALWAYS consolidate information into existing docs

**Before suggesting ANY documentation changes**:
1. Check if an existing doc file covers this topic
2. Update that existing file instead of creating a new one
3. Use CHANGELOG.md for tracking changes over time
4. Only suggest new docs if absolutely no existing file is appropriate

Ensure the documentation accurately reflects the current state of the codebase and maintains consistency with the established GoalStreak architecture and development standards.
