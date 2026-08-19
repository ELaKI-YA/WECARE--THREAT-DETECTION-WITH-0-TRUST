# Evidence mirror-capture update

- Scan Reports second record patient name: Yasiv M. Patel.
- Remaining Doctor green visual accents converted to blue.
- Evidence screenshots now attempt the higher-fidelity DOM/SVG viewport renderer before fallback.
- Application evidence video upgraded to 5 FPS / ~1 Mbps for clearer playback.
- Recording frame updates follow the live WeCare DOM rather than only the simplified fallback renderer.
- Mouse movement is recorded into replay data.
- Evidence video/replay shows a visible browser-style arrow/hand pointer and click pulse.
- Evidence Vault video is displayed at full available width; replay fallback uses a larger mirror-style viewport.
- Existing Admin, Risk Engine, alert, selection, and Evidence Vault access-control behavior otherwise remains unchanged.
