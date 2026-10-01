/**
 * Page Transitions & Router for ODIANEE
 * Smooth curved SVG curtain transition between separate page URLs
 */

class PageRouter {
  constructor() {
    this.curtain = document.getElementById('transition-curtain');
    this.path = document.getElementById('transition-path');
    this.navLinks = document.querySelectorAll('.nav-link');

    // SVG morph paths
    this.paths = {
      start: 'M 0 0 Q 50 0 100 0 L 100 0 Q 50 0 0 0 Z',
      coverCurve: 'M 0 0 Q 50 0 100 0 L 100 100 Q 50 125 0 100 Z',
      coverFlat: 'M 0 0 Q 50 0 100 0 L 100 100 Q 50 100 0 100 Z',
      uncoverCurve: 'M 0 100 Q 50 75 100 100 L 100 100 Q 50 100 0 100 Z',
      uncoverFlat: 'M 0 100 Q 50 100 100 100 L 100 100 Q 50 100 0 100 Z'
    };

    this.initPageEnterAnimation();
    this.setupPageLinks();
  }

  initPageEnterAnimation() {
    // If arriving from a transition or initial load, reveal page with upward curtain wipe
    if (this.curtain && this.path && window.gsap) {
      this.curtain.style.pointerEvents = 'all';
      gsap.timeline({
        onComplete: () => {
          this.curtain.style.pointerEvents = 'none';
        }
      })
      .set(this.path, { attr: { d: this.paths.coverFlat } })
      .to(this.path, { attr: { d: this.paths.uncoverCurve }, duration: 0.45, ease: 'power2.in' })
      .to(this.path, { attr: { d: this.paths.uncoverFlat }, duration: 0.35, ease: 'power2.out' });
    }
  }

  setupPageLinks() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href) return;

        // If link points to current page, do nothing
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const targetPage = href.split('#')[0].split('/').pop() || 'index.html';

        if (currentPage === targetPage && !href.includes('#')) {
          e.preventDefault();
          return;
        }

        // If internal HTML page navigation, do curtain wipe transition
        if (href.endsWith('.html') || href === '/' || href === 'index.html') {
          e.preventDefault();
          this.navigateToUrl(href);
        }
      });
    });
  }

  navigateToUrl(url) {
    if (this.curtain && this.path && window.gsap) {
      this.curtain.style.pointerEvents = 'all';
      gsap.timeline({
        onComplete: () => {
          window.location.href = url;
        }
      })
      .set(this.path, { attr: { d: this.paths.start } })
      .to(this.path, { attr: { d: this.paths.coverCurve }, duration: 0.45, ease: 'power2.in' })
      .to(this.path, { attr: { d: this.paths.coverFlat }, duration: 0.28, ease: 'power2.out' });
    } else {
      window.location.href = url;
    }
  }
}
