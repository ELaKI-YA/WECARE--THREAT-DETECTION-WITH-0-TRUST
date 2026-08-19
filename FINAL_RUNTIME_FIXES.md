# Final runtime fixes

- Doctor report viewer no longer exposes a direct Download button; controlled Export is the only export path.
- Single-record Export opens a compact required-reason authorization modal and is logged/notified to Admin.
- Admin receives single-export View/Acknowledge notifications and Exported Details remains available.
- Bulk/select-all Export is blocked before CSV creation.
- Screenshot and rrweb replay are saved/verified before the Admin Critical alert is emitted.
- The Doctor receives an in-app WeCare restriction modal before session storage is cleared and the login redirect occurs.
- Admin View Evidence opens the matching incident on port 8080.
- The Evidence Vault homepage lists evidence incidents from Doctor/Admin/other supported roles together and is read-only.
- Critical alert dismissal remains one popup at a time with the three-dismissal escalation path.
