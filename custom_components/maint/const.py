"""Constants for the Maint integration."""

DOMAIN = "maint"

WS_TYPE_KEY = "type"
WS_TYPE_TASK_CREATE = "maint/task/create"
WS_TYPE_TASK_DELETE = "maint/task/delete"
WS_TYPE_TASK_UPDATE = "maint/task/update"
WS_TYPE_TASK_LIST = "maint/task/list"

SIGNAL_TASK_CREATED = "maint_task_created"
SIGNAL_TASK_UPDATED = "maint_task_updated"
SIGNAL_TASK_DELETED = "maint_task_deleted"
