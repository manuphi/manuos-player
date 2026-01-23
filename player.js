(() => {
  const p = new URLSearchParams(location.search);
  const v = (p.get("v") || "").trim();
  const t = Math.max(0, parseInt(p.get("t") || "0", 10) || 0);

  const root = document.getElementById("root");

  const WATCH_URL = (id, startSec) => {
    const base = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    return startSec > 0 ? `${base}&t=${startSec}s` : base;
  };

  const EMBED_URL = (id, startSec) => {
    const qs = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1"
    });
    if (startSec > 0) qs.set("start", String(startSec));
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${qs.toString()}`;
  };

  function renderError(msg) {
    root.innerHTML = `
      <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000">
        <div style="color:#fff;font-family:system-ui;padding:16px;max-width:720px;line-height:1.35">
          <div style="font-size:15px;font-weight:600;margin-bottom:8px">ManuOS Player — erreur</div>
          <div style="opacity:.9">${msg}</div>
        </div>
      </div>
    `;
  }

  if (!v) {
    renderError("Ajoute ?v=VIDEO_ID (ex: ?v=nxP3b2VF3_g&t=0)");
    return;
  }
  if (!/^[a-zA-Z0-9_-]{6,}$/.test(v)) {
    renderError("ID YouTube invalide.");
    return;
  }

  const watchUrl = WATCH_URL(v, t);
  const embedSrc = EMBED_URL(v, t);

  // IMPORTANT :
  // - Aucun overlay visible "en permanence" (ça gênait la lecture).
  // - Les actions apparaissent seulement au hover (discret).
  // - Un fallback n'apparaît que si l'iframe ne charge pas dans un délai raisonnable.
  root.innerHTML = `
    <div id="wrap" style="position:fixed;inset:0;background:#000">
      <style>
        /* mini-actions discrètes : visibles seulement au survol / focus */
        #wrap .ytActions{
          position:absolute; top:12px; right:12px;
          display:flex; gap:10px; align-items:center;
          opacity:0; transform:translateY(-4px);
          pointer-events:none;
          transition:opacity .15s ease, transform .15s ease;
        }
        #wrap:hover .ytActions,
        #wrap:focus-within .ytActions{
          opacity:1; transform:translateY(0);
          pointer-events:auto;
        }
        #wrap .ytBtn{
          color:#fff; font-family:system-ui; font-size:13px; text-decoration:none;
          padding:8px 12px;
          border:1px solid rgba(255,255,255,.25);
          border-radius:12px;
          background:rgba(0,0,0,.35);
          backdrop-filter:blur(6px);
        }
        #wrap .ytBtn:active{ transform:scale(.98); }
      </style>

      <iframe
        id="yt"
        src="${embedSrc}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        style="border:0;width:100%;height:100%;display:block"
      ></iframe>

      <div class="ytActions" aria-hidden="true">
        <a class="ytBtn" href="${watchUrl}" target="_blank" rel="noopener">Ouvrir sur YouTube</a>
      </div>

      <div
        id="fallback"
        style="
          position:absolute; inset:0; display:none; align-items:center; justify-content:center;
          background:rgba(0,0,0,.78); backdrop-filter:blur(6px);
        "
      >
        <div style="color:#fff;font-family:system-ui;padding:16px;max-width:760px;line-height:1.35">
          <div style="font-size:15px;font-weight:700;margin-bottom:8px">Impossible de lire la vidéo ici</div>
          <div style="opacity:.9;margin-bottom:12px">
            Certaines vidéos refusent l’intégration (réglage du créateur) ou sont bloquées par YouTube.
            Dans ce cas, ouvre-la directement sur YouTube.
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a
              href="${watchUrl}"
              target="_blank"
              rel="noopener"
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
    </div>
  `;

  const iframe = document.getElementById("yt");
  const fallback = document.getElementById("fallback");
  const btnRetry = document.getElementById("retry");

  const showFallback = () => {
    if (!fallback) return;
    fallback.style.display = "flex";
  };

  const hideFallback = () => {
    if (!fallback) return;
    fallback.style.display = "none";
  };

  btnRetry?.addEventListener("click", () => {
    hideFallback();
    if (iframe?.src) iframe.src = iframe.src; // reload
    armTimeout();
  });

  // Détection : si l'iframe ne "load" pas dans un délai, on affiche le fallback.
  // (On ne peut pas lire l'erreur interne d'un embed YouTube => cross-origin.)
  let loadSeen = false;
  let timeoutId = null;

  const armTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    loadSeen = false;

    // 7s : plus safe pour connexions lentes / premier chargement
    timeoutId = setTimeout(() => {
      if (!loadSeen) showFallback();
    }, 7000);
  };

  iframe?.addEventListener("load", () => {
    loadSeen = true;
    hideFallback();
  });

  armTimeout();
})();
