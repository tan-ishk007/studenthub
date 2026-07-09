/* StudentHub — global animation layer v2
 * Loaded once (in footer.ejs) on every page. Uses GSAP + ScrollTrigger.
 * Hooks into classes that already exist across every view so no view
 * needs page-specific JS to get baseline polish.
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  if (hasGsap && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  /* ---------- Page-load curtain (skip if reduced motion) ---------- */
  const curtain = document.querySelector('.page-curtain');
  if (curtain) {
    if (reduceMotion || !hasGsap) {
      curtain.remove();
    } else {
      window.addEventListener('load', () => {
        gsap.to(curtain, {
          yPercent: -100,
          duration: 0.9,
          delay: 0.15,
          ease: 'power4.inOut',
          onComplete: () => curtain.remove(),
        });
      });
    }
  }

  /* ---------- Scroll progress bar ---------- */
  const progress = document.querySelector('.scroll-progress');
  function updateProgress() {
    if (!progress) return;
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    const pct = height > 0 ? (scrolled / height) * 100 : 0;
    progress.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Navbar hide-on-scroll-down / show-on-scroll-up ---------- */
  const navbar = document.querySelector('.navbar');
  let lastY = window.scrollY;
  document.addEventListener(
    'scroll',
    () => {
      if (!navbar) return;
      const y = window.scrollY;
      navbar.classList.toggle('nav-scrolled', y > 10);
      if (y > lastY && y > 120) {
        navbar.classList.add('nav-hidden');
      } else {
        navbar.classList.remove('nav-hidden');
      }
      lastY = y;
    },
    { passive: true }
  );

  /* ---------- Custom cursor (desktop pointer only) ---------- */
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && !reduceMotion) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2,
      rx = mx,
      ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    function raf() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(raf);
    }
    raf();

    const hoverables = 'a, button, .btn, input, select, textarea, .index-card, .doc-sheet, .card.shadow-sm';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) ring.classList.remove('is-hover');
    });
  }

  if (!hasGsap) return; // Everything below needs GSAP

  if (reduceMotion) {
    document.querySelectorAll('.stat-number').forEach((el) => {
      el.textContent = el.dataset.count || el.textContent;
    });
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    /* ---------- Navbar entrance ---------- */
    if (navbar) {
      gsap.from(navbar, { y: -24, opacity: 0, duration: 0.6, ease: 'power2.out' });
    }

    /* ---------- Flash messages ---------- */
    document.querySelectorAll('.alert').forEach((alert, i) => {
      gsap.from(alert, { y: -16, opacity: 0, duration: 0.5, delay: 0.1 + i * 0.08, ease: 'power2.out' });
    });

    /* ---------- Generic page heading fade, skipping hand-tuned ones ---------- */
    const heading = document.querySelector('main h1, main h2:first-of-type');
    if (heading && !heading.classList.contains('hero-title') && !heading.closest('.reveal-row')) {
      gsap.from(heading, { y: 16, opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 });
    }

    /* ---------- Scroll reveal for card grids not already hand-animated ---------- */
    document.querySelectorAll('.row.g-3, .row.g-2').forEach((row) => {
      if (row.classList.contains('reveal-row')) return; // handled by page-specific script
      const items = row.querySelectorAll(':scope > div');
      if (!items.length) return;
      gsap.from(items, {
        scrollTrigger: { trigger: row, start: 'top 88%', once: true },
        y: 26,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: 'power2.out',
      });
    });

    /* ---------- Table row reveal (admin dashboard) ---------- */
    document.querySelectorAll('table tbody').forEach((tbody) => {
      const rows = tbody.querySelectorAll('tr');
      if (!rows.length) return;
      gsap.from(rows, {
        scrollTrigger: { trigger: tbody, start: 'top 90%', once: true },
        x: -12,
        opacity: 0,
        duration: 0.4,
        stagger: 0.035,
        ease: 'power2.out',
      });
    });

    /* ---------- doc-sheet / card entrance if not inside a reveal-row ---------- */
    document.querySelectorAll('.doc-sheet, .card.shadow-sm').forEach((card) => {
      if (card.closest('.reveal-row') || card.classList.contains('reveal-item')) return;
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 90%', once: true },
        y: 24,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
      });
    });

    /* ---------- Magnetic buttons ---------- */
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.classList.add('magnetic');
      const moveX = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const moveY = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        moveX((e.clientX - r.left - r.width / 2) * 0.3);
        moveY((e.clientY - r.top - r.height / 2) * 0.3);
      });
      btn.addEventListener('mouseleave', () => {
        moveX(0);
        moveY(0);
      });
    });

    /* ---------- Tilt-on-hover for cards flagged .tilt-card ---------- */
    document.querySelectorAll('.tilt-card').forEach((card) => {
      const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power2.out' });
      const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power2.out' });
      const lift = gsap.quickTo(card, 'y', { duration: 0.4, ease: 'power2.out' });
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotateY(px * 12);
        rotateX(py * -12);
        lift(-4);
      });
      card.addEventListener('mouseleave', () => {
        rotateY(0);
        rotateX(0);
        lift(0);
      });
    });
  });
})();
