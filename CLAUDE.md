
## Archive Protocol

### When to Run

Run the FULL archive (all steps below) when ANY of these happen:
- The user says they are closing, archiving, or done with this worktree
- The user asks if everything is saved/committed/stored outside the worktree
- The user says "archive" or "wrap up"
- You are about to end a session where code changes were made

### Mid-Session Rule

After completing any task listed in PROJECT-STATUS.md Active Tasks, move it to Completed with today's date IMMEDIATELY. Do not batch this — update the file as you go. This keeps the handoff document current for other agents reading it.

### Full Archive Steps

1. **Update PROJECT-STATUS.md** incrementally:
   - Move completed tasks to Completed with today's date (YYYY-MM-DD)
   - Add any new decisions made this session with rationale
   - Update Next Steps based on current state
   - Do NOT regenerate from scratch — preserve history
   - If the file does not exist, create it with sections: Intent, Active Tasks, Completed Tasks, Decisions, Next Steps

2. **Update docs/ files** if this session changed anything structural:
   - New or removed dependencies, env vars, API endpoints
   - Architecture changes, new services, changed workflows
   - Infrastructure or deployment changes
   - Gotchas or operational notes discovered during debugging
   - If docs/ does not exist, create docs/README.md (project overview, tech stack, setup) and docs/architecture.md (workflows, endpoints, database tables, credentials locations)
   - If docs/ exists, only update files affected by this session. Leave unaffected files alone.

3. **Update root README.md** if tech stack, setup steps, or commands changed this session.

4. **Commit all documentation changes** to the current worktree branch:
   ```
   docs: archive update — [brief specific summary]
   ```
   Be specific: "docs: archive update — added Convex sessionId schema, updated sync architecture" not "docs: archive update — made improvements"

5. **Copy updated files to the main repo** so they survive worktree cleanup:
   ```
   cp PROJECT-STATUS.md "$CONDUCTOR_ROOT_PATH/"
   cp -r docs/ "$CONDUCTOR_ROOT_PATH/docs/"
   cp README.md "$CONDUCTOR_ROOT_PATH/" (only if changed)
   ```
   `$CONDUCTOR_ROOT_PATH` is set by Conductor and points to the main repo (e.g. `/Users/server/Documents/CursorProjects/dragon-hq/`).

6. **Confirm to the user** what you changed and copied. List the specific files.

### Rules

- Do NOT just say "yes everything is committed." Actually do the updates and copies first, then confirm.
- Do NOT regenerate PROJECT-STATUS.md from scratch — incremental updates preserve session history.
- Do NOT update docs that were not affected by this session's work.
- Do NOT guess or fabricate details. If something is unclear, note it as "undocumented" rather than inventing an answer.
- Base everything on what is actually in the code and git history.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
