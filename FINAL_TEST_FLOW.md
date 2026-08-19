# Final test flow

Run:

```cmd
npm install
npm start
```

Doctor and Admin should be opened in separate browser sessions (for example Chrome + Edge/Incognito).

## Single record export
1. Doctor opens a clinical table.
2. Click a row -> Select.
3. Selection tab appears above the table and row checkboxes appear on the left.
4. Check one record and click Export.
5. Select at least one authorization reason and Confirm Export.
6. CSV downloads.
7. Admin receives a DATA EXPORT NOTICE with View and Acknowledge.
8. Exported Details shows the event.

## Critical bulk export
1. Doctor enters selection mode.
2. Use the selection-tab master checkbox to select all records.
3. Click Export.
4. Export is blocked before a CSV is generated.
5. A sharp screenshot and rrweb session recording are saved.
6. Admin receives the Critical alert only after evidence is verified.
7. Doctor session is restricted after the evidence step.
8. View Evidence opens the same incident in the Evidence Vault.

## Three Admin dismissals
1. Dismiss the same Critical alert with x.
2. It returns after 5 seconds.
3. Dismiss it a second time; it returns once more.
4. Dismiss it a third time.
5. Admin screenshot + session recording are stored as a separate linked incident.
6. Original Doctor incident is marked acknowledgement Failed / dismissals 3 / Higher Official.

## Evidence Vault
Open http://127.0.0.1:8080
Demo credentials: officer / officer123

Evidence contains a screenshot, session recording (rrweb replay), timeline and incident metadata. The recording is the captured WeCare web-app session; it does not record the Windows desktop.
