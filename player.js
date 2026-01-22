(() => {
  const p = new URLSearchParams(location.search);
  const v = (p.get("v") || "").trim();
  const t = Math.max(0, parseInt(p.get("t") || "0", 10) || 0);

  const root = document.getElementById("root");

  const WATCH_URL = (id, startSec) => {
    const base = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    return startSec > 0 ? `${base}&t=${startSec}s` : base;
  };

  function renderShell({ title, bodyHtml }) {
    root.innerHTML = `
      <div style="position:fixed;inset:0;display:flex;flex-direction:column;background:#000">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(0,0,0,.55);backdrop-filter:blur(6px)">
          <div style="color:#fff;font-family:system-ui;font-size:13px;opacity:.9">${title}</div>
          <a
            href="${WATCH_URL(v, t)}"
            target="_blank"
            rel="noopener noreferrer"
            style="color:#fff;font-family:system-ui;font-size:13px;text-decoration:none;padding:6px 10px;border:1px solid rgba(255,255,255,.25);border-radius:10px"
            title="Ouvrir sur YouTube"
          >Ouvrir sur YouTube</a>
        </div>
        <div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center">
          ${bodyHtml}
        </div>
      </div>
    `;
  }

  function renderError(msg) {
    renderShell({
      title: "ManuOS Player",
      bodyHtml: `
        <div style="color:#fff;font-family:system-ui;padding:16px;max-width:720px;line-height:1.35">
          <div style="font-size:15px;font-weight:600;margin-bottom:8px">Lecture impossible</div>
          <div style="opacity:.9">${msg}</div>
        </div>
      `
    });
  }

  if (!v) {
    renderError("Ajoute ?v=VIDEO_ID (ex: ?v=nxP3b2VF3_g&t=0)");
    return;
  }

  if (!/^[a-zA-Z0-9_-]{6,}$/.test(v)) {
    renderError("ID YouTube invalide.");
    return;
  }

  const qs = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1"
  });
  if (t > 0) qs.set("start", String(t));

  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}?${qs.toString()}`;

  // UI "player" + fallback toujours dispo
  renderShell({
    title: "ManuOS Player",
    bodyHtml: `
      <div style="position:relative;width:100%;height:100%">
        <iframe
          id="yt"
          src="${src}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          style="border:0;width:100%;height:100%"
        ></iframe>

        <!-- Fallback panel (affiché si blocage détecté / timeout) -->
        <div
          id="fallback"
          style="
            position:absolute;inset:0;display:none;align-items:center;justify-content:center;
            background:rgba(0,0,0,.75);backdrop-filter:blur(6px);
          "
        >
          <div style="color:#fff;font-family:system-ui;padding:16px;max-width:760px;line-height:1.35">
            <div style="font-size:15px;font-weight:700;margin-bottom:8px">Intégration YouTube désactivée ou bloquée</div>
            <div style="opacity:.9;margin-bottom:12px">
              Certaines vidéos refusent l’intégration (réglage du créateur) ou sont bloquées par YouTube.
              Dans ce cas, ouvre-la directement sur YouTube.
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <a
                href="${WATCH_URL(v, t)}"
                target="_blank"
                rel="noopener noreferrer"
                style="color:#fff;font-family:system-ui;font-size:13px;text-decoration:none;padding:8px 12px;border:1px solid rgba(255,255,255,.25);border-radius:12px;background:rgba(255,255,255,.06)"
              >Ouvrir sur YouTube</a>

              <button
                id="retry"
                type="button"
                style="cursor:pointer;color:#fff;font-family:system-ui;font-size:13px;padding:8px 12px;border:1px solid rgba(255,255,255,.25);border-radius:12px;background:transparent"
              >Réessayer</button>
            </div>
          </div>
        </div>

        <!-- Lien discret toujours disponible (même si l'embed affiche un message interne) -->
        <button
          id="help"
          type="button"
          style="
            position:absolute;right:12px;bottom:12px;cursor:pointer;
            color:#fff;font-family:system-ui;font-size:12px;
            padding:6px 10px;border:1px solid rgba(255,255,255,.22);border-radius:999px;
            background:rgba(0,0,0,.35)
          "
          title="Problème de lecture ?"
        >Problème de lecture ?</button>
      </div>
    `
  });

  const iframe = document.getElementById("yt");
  const fallback = document.getElementById("fallback");
  const btnHelp = document.getElementById("help");
  const btnRetry = document.getElementById("retry");

  const showFallback = () => {
    if (!fallback) return;
    fallback.style.display = "flex";
  };

  const hideFallback = () => {
    if (!fallback) return;
    fallback.style.display = "none";
  };

  btnHelp?.addEventListener("click", showFallback);
  btnRetry?.addEventListener("click", () => {
    hideFallback();
    // force reload de l'iframe
    const cur = iframe?.src;
    if (iframe && cur) {
      iframe.src = cur;
    }
    // relance le timer de détection
    armTimeout();
  });

  // Détection "raisonnable" : si l'iframe ne charge pas dans un délai → fallback.
  let loadSeen = false;
  let timeoutId = null;

  const armTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    loadSeen = false;

    // 4s : laisse le temps aux connexions lentes / 1er chargement
    timeoutId = setTimeout(() => {
      // Si aucun load, on considère très probable un blocage.
      if (!loadSeen) showFallback();
    }, 4000);
  };

  iframe?.addEventListener("load", () => {
    loadSeen = true;

    // Même si "load" arrive, certaines pages embarquées affichent un message d’erreur.
    // On ne peut pas le lire (cross-origin), donc on laisse le bouton "Problème de lecture ?"
    // + on ne force pas le fallback si l’iframe a chargé.
  });

  armTimeout();
})();
