# Integrated Doctor + Admin Feature Set

This package keeps the existing Doctor/Admin functionality and the Behavior Risk Distribution scatter plot.

## Doctor selection/export
- Checkboxes hidden during normal browsing.
- Choosing Select enters selection mode and exposes row checkboxes on the left.
- Top checkbox selects/deselects all records in the active table.
- Export operates on checked records.
- Single-record export requires an export-purpose authorization reason.
- Single-record export is allowed, logged, and sent to Admin as a normal notification.
- Bulk/select-all export remains a Critical security path.

## Admin single-export tracking
- Admin receives a notification for allowed single-record exports.
- Notification includes Doctor, exported record/report, reason, date/time, and result.
- Exported Details supports View and Acknowledge status.

## Critical bulk export
- Bulk export is blocked.
- Critical incident/evidence workflow remains enabled.
- Admin receives the Critical alert.
- Doctor session restriction/termination remains part of the Critical flow.

## Admin escalation
- Critical alert dismissal workflow remains separate from normal export notifications.
- Existing 3-dismissal/evidence escalation logic is retained where implemented by the project.

## AI Security Center
- Behavior Risk Distribution scatter plot:
  - X-axis: activity volume
  - Y-axis: risk score
  - points represent recorded sessions/predictions
- Existing security timeline/prediction content remains available according to the current Admin build.

This integration file is documentation only; it does not replace runtime security checks.
