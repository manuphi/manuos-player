(() => {
  const p = new URLSearchParams(location.search);
  const v = (p.get("v") || "").trim();
  const t = Math.max(0, parseInt(p.get("t") || "0", 10) || 0);

  const root = document.getElementById("root");

  function renderError(msg) {
    root.innerHTML = `<div style="color:#fff;font-family:system-ui;padding:16px">${msg}</div>`;
  }

  if (!v) {
    renderError("ManuOS Player : ajoute ?v=VIDEO_ID (ex: ?v=nxP3b2VF3_g&t=0)");
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

  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;

  root.appendChild(iframe);
})();
