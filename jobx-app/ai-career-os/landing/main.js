(() => {
  const burger = document.querySelector(".burger");
  const overlay = document.getElementById("menu-overlay");
  const menu = document.getElementById("mobile-menu");
  const mobileLinks = menu ? menu.querySelectorAll("a") : [];

  function setMenuOpen(open) {
    if (!burger || !overlay || !menu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    overlay.hidden = !open;
    menu.hidden = !open;
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("menu-open", open);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  if (burger) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") !== "true";
      setMenuOpen(open);
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeMenu);
  }

  mobileLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateValue(el, target, decimals, duration, delay) {
    const numEl = el.querySelector(".stat-num");
    if (!numEl) return;

    window.setTimeout(() => {
      const start = performance.now();

      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const value = target * easeOutCubic(t);
        numEl.textContent = value.toFixed(decimals);
        if (t < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }, delay);
  }

  const stats = document.querySelectorAll(".stat");
  let counted = false;

  function runCounters() {
    if (counted) return;
    counted = true;
    stats.forEach((stat, i) => {
      const target = Number(stat.dataset.target || 0);
      const decimals = Number(stat.dataset.decimals || 0);
      const duration = 1500 + i * 80;
      const delay = 480 + i * 90;
      animateValue(stat, target, decimals, duration, delay);
    });
  }

  if ("IntersectionObserver" in window && stats.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) runCounters();
        });
      },
      { threshold: 0.25 },
    );
    stats.forEach((stat) => observer.observe(stat));
  } else {
    runCounters();
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stats.forEach((stat) => {
      const numEl = stat.querySelector(".stat-num");
      const target = Number(stat.dataset.target || 0);
      const decimals = Number(stat.dataset.decimals || 0);
      if (numEl) numEl.textContent = target.toFixed(decimals);
    });
    counted = true;
  }
})();
