(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const reveal = () => {
    document.querySelectorAll('.card,.dish-card,.section-title,.section-subtitle,.components-section-title').forEach((el, i) => {
      if (el.dataset.fpMotion) return;
      el.dataset.fpMotion = '1';
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = `opacity .65s ease ${Math.min(i * 35, 280)}ms, transform .65s cubic-bezier(.2,.8,.2,1) ${Math.min(i * 35, 280)}ms`;
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    });
  };

  const tilt = (el) => {
    if (el.dataset.fpTilt || window.innerWidth < 900) return;
    el.dataset.fpTilt = '1';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `translateY(-7px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  };

  const observe = () => {
    reveal();
    document.querySelectorAll('.card,.dish-card').forEach(tilt);
  };

  new MutationObserver(observe).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('load', observe, { once: true });
  observe();
})();
