(() => {
  "use strict";

  let frame = 0;

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(fitMobileHeadline);
  }

  function fitMobileHeadline() {
    frame = 0;
    const track = document.getElementById("liveTrack");
    if (!track) return;

    const current = normalize(track.textContent);
    const previousRendered = track.dataset.blMobileRendered || "";
    const previousFull = track.dataset.blMobileFull || "";
    const mobile = matchMedia("(max-width:760px)").matches;

    if (!mobile) {
      if (previousFull && current === previousRendered) track.textContent = previousFull;
      delete track.dataset.blMobileFull;
      delete track.dataset.blMobileRendered;
      track.style.removeProperty("--bl-live-end");
      track.style.removeProperty("--bl-live-duration");
      return;
    }

    let full = previousFull;
    if (!full || current !== previousRendered) full = current;
    if (!full) return;

    const message = normalize(full.replace(/^BL\s*LIVE\s*[｜|]\s*/i, "")) || full;
    const characters = Array.from(message);
    let rendered = message;

    track.style.setProperty("animation", "none", "important");
    track.style.setProperty("transform", "none", "important");
    track.style.setProperty("text-indent", "0px", "important");
    track.style.removeProperty("--bl-live-end");
    track.style.removeProperty("--bl-live-duration");
    track.textContent = rendered;

    while (track.scrollWidth > track.clientWidth && characters.length > 4) {
      characters.pop();
      rendered = `${characters.join("")}…`;
      track.textContent = rendered;
    }

    track.dataset.blMobileFull = full;
    track.dataset.blMobileRendered = rendered;
    track.title = full;
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) schedule();
  });
  schedule();
})();
