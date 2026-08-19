# WeCare Phase 15 — Final Integrated Feature Set

## Doctor
- Existing Doctor dashboard preserved.
- Clinical tabs retain synthetic demo data.
- Selection mode:
  - No permanent checkboxes.
  - Choosing Select opens a selection bar/tab above the table.
  - Checkbox column appears on the far left.
  - Master checkbox selects/deselects all.
  - Export downloads checked records.
- Single-record export:
  - Requires an export-purpose authorization reason.
  - Allowed after a reason is selected.
  - Logged and sent to Admin.
- Bulk/select-all export:
  - Classified Critical.
  - Export blocked before file generation.
  - Evidence capture starts.
  - Admin alert follows after evidence save/verification.
  - Doctor session restriction/termination follows the evidence step.

## Admin
- Normal single-record export notification:
  - Doctor
  - Patient/report
  - Reason
  - Date/time
  - Result
  - View
  - Acknowledge
- Exported Details history under Doctor activity.
- Critical alert:
  - Doctor
  - Role
  - Action
  - Record count
  - Risk
  - Result
  - Date/time
  - Incident ID
  - View Evidence
  - Top-right close (x)
- 3-dismissal flow:
  - One alert at a time.
  - First x -> retry.
  - Second x -> retry.
  - Third x -> acknowledgement failed.
  - Original incident escalated to Higher Official.
  - Separate linked Admin incident preserved.

## AI Security Center
- Behavior Risk Distribution scatter plot.
- X-axis: activity volume.
- Y-axis: risk score.
- Points represent user/session behavior.
- Existing threat timeline/prediction content retained where present.

## Evidence
High/Critical evidence package should contain:
- screenshot.png
- replay.json
- timeline.json
- incident.json
- manifest.json
- playable recording when generated successfully

Evidence flow:
1. Block dangerous action.
2. Capture screenshot.
3. Finalize replay.
4. Save evidence.
5. Verify files exist.
6. Create/update Evidence Vault incident.
7. Send Admin alert.
8. Restrict/terminate Doctor session if required.

Screenshot:
- Exact visible WeCare application state.
- No artificial cursor overlay.

Replay:
- Mouse movement coordinates.
- Click positions.
- Scrolling.
- Dropdowns.
- Checkboxes/selection.
- Page/section changes.
- Export click.

Playback:
- Reconstructed from recorded session events.
- Normal cursor follows recorded mouse path.
- If generated video is invalid/unavailable, replay remains the authoritative playback source instead of showing a broken 0:00 video.

## Evidence Vault
- Separate/read-only.
- View screenshot.
- Play replay.
- Play recording if valid.
- View timeline.
- Acknowledgement/dismissal/escalation status.
- Linked Doctor/Admin incidents.
