# Integration Notes

## Import Structure

```python
# How to import components:
from src.config.settings import settings
from src.orchestration.spawner import spawn_claude
from src.orchestration.state_machine import Status, TRANSITIONS
from src.orchestration.watcher import FileWatcher
from src.workspace.manager import WorkspaceManager
from src.models.state import State
from src.models.task import Task
```

## Dependency Order

Build in this order to avoid import issues:

1. `src/config/settings.py` (no internal deps)
2. `src/models/*.py` (no internal deps)
3. `src/workspace/locking.py` (no internal deps)
4. `src/orchestration/logging.py` (depends on settings)
5. `src/workspace/manager.py` (depends on locking)
6. `src/orchestration/spawner.py` (depends on settings)
7. `src/orchestration/watcher.py` (depends on settings)
8. `src/orchestration/state_machine.py` (depends on models)
9. `src/orchestration/manager.py` (depends on everything above)
10. `src/main.py` (depends on manager)

## Notes

(Add integration discoveries here)
