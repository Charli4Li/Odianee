/**
 * History View Logic
 * Horizontal scroll with mouse wheel translation and typography animations
 */

class HistoryView {
  constructor() {
    this.container = document.getElementById('view-history');
    this.progressBar = document.getElementById('history-progress');
    if (!this.container) return;

    this.initWheelScroll();
    this.initScrollAnimations();
  }

  initWheelScroll() {
    this.container.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.container.scrollLeft += e.deltaY * 1.1;
      }
    }, { passive: false });

    this.container.addEventListener('scroll', () => {
      const maxScroll = this.container.scrollWidth - this.container.clientWidth;
      if (maxScroll > 0 && this.progressBar) {
        const pct = (this.container.scrollLeft / maxScroll) * 100;
        this.progressBar.style.width = `${pct}%`;
      }
    });
  }

  initScrollAnimations() {
    const sections = this.container.querySelectorAll('.scroll-section');
    if (!sections.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const title = entry.target.querySelector('.section-title');
            const para = entry.target.querySelector('.section-para');
            const img = entry.target.querySelector('.section-img');
            const num = entry.target.querySelector('.section-num');

            if (window.gsap) {
              gsap.fromTo(num, { opacity: 0, y: 30 }, { opacity: 0.9, y: 0, duration: 0.6, ease: 'power2.out' });
              gsap.fromTo(title, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.1 });
              gsap.fromTo(para, { opacity: 0, y: 40 }, { opacity: 0.9, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.2 });
              gsap.fromTo(img, { scale: 1.1, opacity: 0.7 }, { scale: 1.0, opacity: 1, duration: 0.9, ease: 'power2.out' });
            }
          }
        });
      }, { root: this.container, threshold: 0.4 });

      sections.forEach(s => observer.observe(s));
    }
  }
}
