# Admin 3x dismissal + evidence update

This build keeps the existing Doctor/Admin UI and Evidence Vault, and fixes the critical-alert escalation flow.

- One Critical alert is shown at a time.
- First dismissal is stored; alert retries after 5 seconds.
- Second dismissal is stored; alert retries after 5 seconds.
- Third dismissal triggers Admin evidence capture before escalation is finalized.
- Admin evidence is linked to the original Doctor incident.
- Original Doctor incident is then marked Admin Acknowledgement = Failed, Dismissals = 3, Escalation = Higher Official.
- Evidence Vault shows the three dismissal timestamps and linked incident information.
- Evidence capture uses a bounded rolling WeCare viewport recording to avoid oversized/0:00 uploads.
- Screenshot is captured without the artificial cursor overlay; recording/replay retains pointer movement/clicks.
- Evidence Vault displays incident times in Asia/Kolkata (IST).
- Evidence entries report Complete/Partial capture status instead of pretending missing media is complete.

Browser limitation: exact desktop/tab video still requires browser screen-sharing permission. This build records/replays the WeCare application session only.
