(() => {
  const box = document.getElementById("criticalAlert");
  const close = document.getElementById("criticalAlertClose");
  const evidence = document.getElementById("criticalAlertEvidence");
  const title = document.getElementById("criticalAlertTitle");
  const details = document.getElementById("criticalAlertDetails");

  if (
    !box ||
    !close ||
    !evidence ||
    typeof io !== "function"
  ) {
    return;
  }

  const EVIDENCE_VAULT_URL =
    "https://wecare-evidenc-vault.onrender.com";

  let current = null;
  let retryTimer = null;
  let busy = false;
  let finalMode = false;
  let finalEvidenceCode = "";

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[c]
    );

  const codeOf = (ev) =>
    ev?.incidentCode ||
    (ev?.incidentId
      ? `INC-${String(ev.incidentId).padStart(5, "0")}`
      : "");

  const token = () =>
    sessionStorage.getItem("htd_token");

  const hide = () => {
    box.hidden = true;
    box.style.display = "none";
    box.setAttribute("aria-hidden", "true");
  };

  const show = () => {
    box.hidden = false;
    box.style.display = "flex";
    box.setAttribute("aria-hidden", "false");
  };


  /* =========================================================
     Render Critical Alert
  ========================================================= */

  function render(ev) {
    const code = codeOf(ev);

    if (!code) return;

    if (
      current &&
      codeOf(current) === code &&
      !box.hidden &&
      !finalMode
    ) {
      return;
    }

    clearTimeout(retryTimer);

    current = { ...ev };
    finalMode = false;
    finalEvidenceCode = "";

    const when =
      current.time ||
      current.timestamp ||
      new Date().toISOString();

    const count = Number(
      current.requestedCount ||
      current.recordCount ||
      0
    );

    title.textContent =
      "Critical security action blocked";

    details.innerHTML = `
      <div>
        <span>Doctor</span>
        <strong>
          ${esc(
            current.doctor ||
            current.fullName ||
            current.username ||
            "Doctor"
          )}
        </strong>
      </div>

      <div>
        <span>Role</span>
        <strong>
          ${esc(
            current.role
              ? current.role[0].toUpperCase() +
                current.role.slice(1)
              : "Doctor"
          )}
        </strong>
      </div>

      <div>
        <span>Action</span>
        <strong>
          ${esc(
            current.actionLabel ||
            current.actionType ||
            "Bulk data export"
          )}
        </strong>
      </div>

      <div>
        <span>Records</span>
        <strong>
          ${
            count
              ? count.toLocaleString("en-IN")
              : "-"
          }
        </strong>
      </div>

      <div>
        <span>Risk</span>
        <strong>
          ${esc(
            current.riskLevel ||
            current.risk ||
            "Critical"
          )}
        </strong>
      </div>

      <div>
        <span>Result</span>
        <strong>
          ${esc(
            current.result ||
            "Blocked"
          )}
        </strong>
      </div>

      <div>
        <span>Date / Time</span>
        <strong>
          ${esc(
            new Date(when).toLocaleString(
              "en-IN",
              {
                timeZone: "Asia/Kolkata"
              }
            )
          )}
        </strong>
      </div>

      <div>
        <span>Incident</span>
        <strong>
          ${esc(code)}
        </strong>
      </div>
    `;

    evidence.disabled = false;
    evidence.textContent = "View Evidence";

    close.disabled = false;

    show();
  }


  /* =========================================================
     Capture Admin Ignore Evidence
  ========================================================= */

  async function captureAdminIgnore(
    adminIncident
  ) {
    if (
      typeof window.WECareCaptureEvidence !==
      "function"
    ) {
      throw new Error(
        "Security processing is unavailable"
      );
    }

    title.textContent =
      "Processing critical escalation";

    details.innerHTML = `
      <div>
        <span>Action</span>
        <strong>
          Critical alert dismissed three times
        </strong>
      </div>

      <div>
        <span>Related incident</span>
        <strong>
          ${esc(
            adminIncident.originalIncidentCode
          )}
        </strong>
      </div>

      <div>
        <span>Status</span>
        <strong>
          Preserving security records before escalation…
        </strong>
      </div>
    `;

    evidence.disabled = true;
    close.disabled = true;

    show();

    const saved =
      await window.WECareCaptureEvidence(
        adminIncident
      );

    if (
      !saved?.incidentCode ||
      saved.evidenceStatus !== "Complete"
    ) {
      throw new Error(
        "Security records could not be preserved completely"
      );
    }

    return saved;
  }


  /* =========================================================
     Critical Alert Dismissal
  ========================================================= */

  close.addEventListener(
    "click",
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (finalMode) {
        hide();
        return;
      }

      if (busy || !current) {
        return;
      }

      const code = codeOf(current);

      if (!code) {
        hide();
        return;
      }

      busy = true;

      try {
        const t = token();

        if (!t) {
          throw new Error(
            "Admin session unavailable"
          );
        }

        const response = await fetch(
          "/api/admin/critical-alert-dismissal",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                "Bearer " + t
            },

            body: JSON.stringify({
              incidentCode: code
            })
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Unable to record dismissal"
          );
        }

        if (
          data.reviewed ||
          data.escalated
        ) {
          hide();
          return;
        }

        if (data.requiresEscalation) {
          const saved =
            await captureAdminIgnore(
              data.adminIncident
            );

          const finalizeResponse =
            await fetch(
              "/api/admin/critical-alert-escalate-complete",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    "Bearer " + t
                },

                body: JSON.stringify({
                  incidentCode: code,

                  adminEvidenceIncidentCode:
                    saved.incidentCode
                })
              }
            );

          const finalData =
            await finalizeResponse.json();

          if (!finalizeResponse.ok) {
            throw new Error(
              finalData.message ||
              "Unable to finalize escalation"
            );
          }

          finalMode = true;
          finalEvidenceCode = "";

          clearTimeout(retryTimer);

          title.textContent =
            "Critical incident escalated";

          details.innerHTML = `
            <div>
              <span>
                Admin acknowledgement
              </span>

              <strong>
                Failed
              </strong>
            </div>

            <div>
              <span>
                Alert dismissals
              </span>

              <strong>
                3
              </strong>
            </div>

            <div>
              <span>
                Reported to
              </span>

              <strong>
                Higher Official
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                Escalated for security review
              </strong>
            </div>
          `;

          evidence.disabled = false;

          evidence.textContent =
            "View Doctor Evidence";

          close.disabled = false;

          show();
        } else {
          const snapshot = {
            ...current
          };

          hide();

          retryTimer =
            setTimeout(
              () => render(snapshot),
              5000
            );
        }
      } catch (err) {
        console.error(
          "Critical alert dismissal failed:",
          err
        );

        title.textContent =
          "Alert action failed";

        details.innerHTML = `
          <div>
            <span>Error</span>
            <strong>
              ${esc(err.message)}
            </strong>
          </div>
        `;

        close.disabled = false;

        show();
      } finally {
        busy = false;
      }
    }
  );


  /* =========================================================
     View Doctor Evidence
  ========================================================= */

  evidence.addEventListener(
    "click",
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      /*
        Admin dashboard is allowed to open
        only the Doctor's incident evidence.

        Any evidence generated for
        Administrator behavior remains
        Evidence-Vault-only.
      */

      const target =
        codeOf(current);

      if (!target) {
        return;
      }

      clearTimeout(retryTimer);

      if (!finalMode) {
        try {
          const t = token();

          if (t) {
            await fetch(
              "/api/admin/critical-alert-acknowledge",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    "Bearer " + t
                },

                body: JSON.stringify({
                  incidentCode: target
                })
              }
            );
          }
        } catch (_) {
          // Do not block evidence viewing
          // if acknowledgement fails.
        }
      }

      const vaultUrl =
        `${EVIDENCE_VAULT_URL}/?incident=${encodeURIComponent(
          target
        )}`;

      window.open(
        vaultUrl,
        "_blank",
        "noopener,noreferrer"
      );

      hide();
    }
  );


  /* =========================================================
     Socket.IO
  ========================================================= */

  const user = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem(
          "htd_user"
        ) || "{}"
      );
    } catch (_) {
      return {};
    }
  })();

  const socket = io({
    auth: {
      userId: user.id,
      role: user.role
    }
  });

  socket.on(
    "admin:critical-alert",
    (ev) => {
      if (
        ev?.suppressAdminAlert
      ) {
        return;
      }

      render(ev);
    }
  );


  /* =========================================================
     Public Helper
  ========================================================= */

  window.WECareShowCriticalAlert =
    render;

  hide();
})();
