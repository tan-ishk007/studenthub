/* StudentHub — global animation layer
 * Loaded once (in footer.ejs) on every page. Uses GSAP + ScrollTrigger,
 * both already loaded in header.ejs.
 *
 * Strategy: hook into classes that already exist across every view
 * (.navbar, .alert, .card, .row, table rows, .doc-stamp) instead of
 * editing each EJS template individually. Anything with the class
 * `.reveal-item` is treated as already-animated and skipped so this
 * script never double-animates something a page author hand-tuned.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(typeof ScrollTrigger !== 'undefined' ? ScrollTrigger : undefined);

  // Respect users who've asked for less motion.
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    gsap.set('*', { clearProps: 'all' });
    return;
  }

  /* ---------- Smooth scroll site-wide ---------- */
  document.documentElement.style.scrollBehavior = 'smooth';

  /* ---------- Navbar: fade + drop in on load ---------- */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    gsap.from(navbar, {
      y: -24,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    });
  }

  /* ---------- Flash messages: slide down + fade in ---------- */
  document.querySelectorAll('.alert').forEach((alert, i) => {
    gsap.from(alert, {
      y: -16,
      opacity: 0,
      duration: 0.5,
      delay: 0.1 + i * 0.08,
      ease: 'power2.out',
    });
  });

  /* ---------- Page headings: fade + slide in ---------- */
  const heading = document.querySelector('main h1, main h2:first-of-type');
  if (heading && !heading.classList.contains('reveal-item')) {
    gsap.from(heading, {
      y: 16,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    });
  }

  /* ---------- Doc stamps / admin badges: rotate-in ---------- */
  document.querySelectorAll('.doc-stamp').forEach((stamp, i) => {
    gsap.from(stamp, {
      rotate: -12,
      opacity: 0,
      scale: 0.85,
      duration: 0.5,
      delay: 0.2 + i * 0.05,
      ease: 'back.out(1.7)',
    });
  });

  /* ---------- Cards: scroll-triggered reveal with stagger ---------- */
  // Group cards by their nearest .row so paginated / grid layouts
  // stagger together instead of all firing independently.
  const cardRows = document.querySelectorAll('.row');

  if (cardRows.length && typeof ScrollTrigger !== 'undefined') {
    cardRows.forEach((row) => {
      const cards = row.querySelectorAll(':scope > [class*="col"] .card:not(.reveal-item)');
      if (!cards.length) return;

      gsap.from(cards, {
        y: 32,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: row,
          start: 'top 88%',
          once: true,
        },
      });
    });

    // Standalone cards that aren't inside a .row (e.g. auth forms,
    // profile page, single resource show page).
    const standaloneCards = document.querySelectorAll(
      'main > .card:not(.reveal-item), main > .container > .card:not(.reveal-item)'
    );
    if (standaloneCards.length) {
      gsap.from(standaloneCards, {
        y: 24,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: standaloneCards[0],
          start: 'top 90%',
          once: true,
        },
      });
    }
  } else {
    // Fallback if ScrollTrigger didn't load: just fade cards in on load.
    document.querySelectorAll('.card:not(.reveal-item)').forEach((card, i) => {
      gsap.from(card, {
        y: 24,
        opacity: 0,
        duration: 0.5,
        delay: 0.1 + i * 0.05,
        ease: 'power2.out',
      });
    });
  }

  /* ---------- Admin dashboard: table row reveal ---------- */
  document.querySelectorAll('table tbody').forEach((tbody) => {
    const rows = tbody.querySelectorAll('tr');
    if (!rows.length) return;

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.from(rows, {
        opacity: 0,
        x: -12,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: tbody,
          start: 'top 90%',
          once: true,
        },
      });
    } else {
      gsap.from(rows, {
        opacity: 0,
        x: -12,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power1.out',
      });
    }
  });

  /* ---------- Buttons: subtle hover interaction ---------- */
  document.querySelectorAll('.btn').forEach((btn) => {
    const hoverIn = () =>
      gsap.to(btn, { scale: 1.04, duration: 0.18, ease: 'power1.out' });
    const hoverOut = () =>
      gsap.to(btn, { scale: 1, duration: 0.18, ease: 'power1.out' });

    btn.addEventListener('mouseenter', hoverIn);
    btn.addEventListener('mouseleave', hoverOut);
    btn.addEventListener('focus', hoverIn);
    btn.addEventListener('blur', hoverOut);
  });
});
