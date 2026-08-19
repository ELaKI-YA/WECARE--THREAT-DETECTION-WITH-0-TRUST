# Evidence Capture Fix

This build fixes the recursive renderer failure that could create blank/washed screenshots and 0:00 WebM evidence.

Changes:
- Removed recursive render failure loop.
- 10 FPS / 1.8 Mbps application viewport recording.
- Snapshot assets resolve against the running WeCare origin during replay.
- Evidence Vault validates WebM duration before showing it.
- Invalid/zero-duration WebM automatically falls back to session replay instead of showing 0:00 / 0:00.
- Mouse movement, pointer/hand state and click pulses remain recorded in replay.

Browser limitation: exact capture of the entire operating-system desktop requires the browser Screen Capture permission. This build captures/replays the WeCare application itself without silently capturing other applications.
