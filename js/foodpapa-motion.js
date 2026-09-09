(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The current landing page contains an accidental literal "\\n" text node.
  // Remove it at runtime so the browser can render the page cleanly even before
  // older HTML is refreshed.
  const removeStrayText = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.trim() === '\\n') node.remove();
    });
  };

  const reveal = () => {
    if (reduced) return;
    document.querySelectorAll('.card,.dish-card,.team-wrapper,.testimonial-card,.section-title,.section-subtitle,.components-section-title').forEach((el, i) => {
      if (el.dataset.fpMotion) return;
      el.dataset.fpMotion = '1';
      el.classList.add('fp-reveal');
      el.style.transitionDelay = `${Math.min(i * 35, 280)}ms`;
      requestAnimationFrame(() => el.classList.add('is-visible'));
    });
  };

  const tilt = (el) => {
    if (reduced || el.dataset.fpTilt || window.innerWidth < 900) return;
    el.dataset.fpTilt = '1';
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `translateY(-7px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  };

  const hero3D = () => {
    const hero = document.querySelector('.overlay');
    if (!hero || reduced || hero.dataset.fpHero) return;
    hero.dataset.fpHero = '1';

    const orbit = document.createElement('span');
    orbit.className = 'fp-orbit';
    hero.appendChild(orbit);

    hero.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 900) return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty('--fp-mx', `${(x * 10).toFixed(2)}px`);
      hero.style.setProperty('--fp-my', `${(y * 8).toFixed(2)}px`);
      hero.style.backgroundPosition = `calc(50% + ${x * -18}px) calc(50% + ${y * -12}px)`;
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--fp-mx', '0px');
      hero.style.setProperty('--fp-my', '0px');
      hero.style.backgroundPosition = 'center';
    });
  };

  const navState = () => {
    const links = document.querySelectorAll('.nav a, .navbar-nav a');
    links.forEach((link) => {
      if (!link.hash || !document.querySelector(link.hash)) return;
      link.addEventListener('click', () => {
        links.forEach((item) => item.classList.remove('fp-active'));
        link.classList.add('fp-active');
      });
    });
  };

  const observe = () => {
    removeStrayText();
    reveal();
    hero3D();
    document.querySelectorAll('.card,.dish-card,.team-wrapper,.testimonial-card').forEach(tilt);
    navState();
  };

  observe();
  window.addEventListener('load', observe, { once: true });
  new MutationObserver(observe).observe(document.body, { childList: true, subtree: true });
})();
