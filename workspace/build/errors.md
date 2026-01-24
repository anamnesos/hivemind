# Build Errors

**Check this file when something breaks. Update it when you fix something.**

---

## Active Errors

### `Extra inputs are not permitted [type=extra_forbidden]` - OPEN
- **Where**: src/config/settings.py line 42, `settings = Settings()`
- **Cause**: Pydantic Settings has `extra = "forbid"` but environment has `ANTHROPIC_API_KEY` which isn't in the model
- **Error**: `pydantic_core.ValidationError: 1 validation error for Settings - anthropic_api_key - Extra inputs are not permitted`
- **Owner**: Worker A (settings.py owner)
- **Suggested Fix**: Either add `anthropic_api_key: str | None = None` to Settings, or change model_config to `extra = "ignore"`
- **Found by**: Worker B

### `Input must be provided either through stdin or as a prompt argument` - RESOLVED
- **Where**: spawner.py subprocess call
- **Cause**: Passing instruction as positional arg didn't work with --system-prompt and long multi-line content on Windows
- **Fix**: Pass instruction via stdin using `process.communicate(input=...)`
- **Fixed by**: Lead

### `[WinError 2] The system cannot find the file specified` - RESOLVED
- **Where**: spawner.py, subprocess_exec call
- **Cause**: Windows asyncio.create_subprocess_exec doesn't search PATH like shell does
- **Fix**: Added `get_claude_executable()` to resolve full path using shutil.which()
- **Fixed by**: Lead

---

## Resolved Errors

### `HivemindOrchestrator.__init__() got an unexpected keyword argument 'roles_path'`
- **Where**: ui.py line 220, main.py line 61
- **Cause**: Both files passed `roles_path` but manager.py gets it from settings
- **Fix**: Removed the argument from both files
- **Fixed by**: Lead

### `Roles directory not found`
- **Where**: settings.py paths
- **Cause**: Relative paths (`./roles`) don't work when running from subdirectory
- **Fix**: Changed to absolute paths using `PROJECT_ROOT`
- **Fixed by**: Lead

---

## How to Add Errors

```markdown
### `Error message here`
- **Where**: file and line
- **Cause**: Why it happened
- **Fix**: What to do (or "needs investigation")
- **Fixed by**: (your role)
```
