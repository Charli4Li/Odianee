/**
 * Page Transitions & Router for ODIANEE
 * GSAP SVG curved curtain morphing transition identical to pahari.vercel.app
 */

class PageRouter {
  constructor() {
    this.curtain = document.getElementById('transition-curtain');
    this.path = document.getElementById('transition-path');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.views = {
      collection: document.getElementById('view-collection'),
      history: document.getElementById('view-history'),
      process: document.getElementById('view-process')
    };

    this.currentViewId = 'collection';
    this.isTransitioning = false;

    // SVG morph paths
    this.paths = {
      start: 'M 0 0 Q 50 0 100 0 L 100 0 Q 50 0 0 0 Z',
      coverCurve: 'M 0 0 Q 50 0 100 0 L 100 100 Q 50 125 0 100 Z',
      coverFlat: 'M 0 0 Q 50 0 100 0 L 100 100 Q 50 100 0 100 Z',
      uncoverCurve: 'M 0 100 Q 50 75 100 100 L 100 100 Q 50 100 0 100 Z',
      uncoverFlat: 'M 0 100 Q 50 100 100 100 L 100 100 Q 50 100 0 100 Z'
    };

    this.setupNavigation();
    this.handleInitialRoute();
  }

  setupNavigation() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        if (targetView && targetView !== this.currentViewId) {
          this.navigateTo(targetView);
        }
      });
    });

    window.addEventListener('popstate', (e) => {
      const stateView = e.state ? e.state.view : this.getViewFromHash();
      if (stateView && stateView !== this.currentViewId) {
        this.navigateTo(stateView, false);
      }
    });
  }

  getViewFromHash() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'history') return 'history';
    if (hash === 'process' || hash === 'making-of') return 'process';
    return 'collection';
  }

  handleInitialRoute() {
    const initialView = this.getViewFromHash();
    this.switchViewDOM(initialView);
    this.currentViewId = initialView;
    this.updateNavState(initialView);
  }

  navigateTo(targetViewId, updateHistory = true) {
    if (this.isTransitioning || targetViewId === this.currentViewId) return;
    this.isTransitioning = true;

    if (updateHistory) {
      const hash = targetViewId === 'collection' ? '' : `#${targetViewId}`;
      window.history.pushState({ view: targetViewId }, '', window.location.pathname + hash);
    }

    this.updateNavState(targetViewId);

    if (window.gsap && this.path) {
      // 1. Wipe Down Transition
      this.curtain.style.pointerEvents = 'all';

      const tl = gsap.timeline({
        onComplete: () => {
          // Switch active view DOM while curtain is closed
          this.switchViewDOM(targetViewId);
          this.currentViewId = targetViewId;

          // 2. Wipe Up Transition
          gsap.timeline({
            onComplete: () => {
              this.curtain.style.pointerEvents = 'none';
              this.isTransitioning = false;
            }
          })
          .set(this.path, { attr: { d: this.paths.coverFlat } })
          .to(this.path, { attr: { d: this.paths.uncoverCurve }, duration: 0.5, ease: 'power2.in' })
          .to(this.path, { attr: { d: this.paths.uncoverFlat }, duration: 0.35, ease: 'power2.out' });
        }
      });

      tl.set(this.path, { attr: { d: this.paths.start } })
        .to(this.path, { attr: { d: this.paths.coverCurve }, duration: 0.5, ease: 'power2.in' })
        .to(this.path, { attr: { d: this.paths.coverFlat }, duration: 0.3, ease: 'power2.out' });

    } else {
      // Fallback instant switch
      this.switchViewDOM(targetViewId);
      this.currentViewId = targetViewId;
      this.isTransitioning = false;
    }
  }

  switchViewDOM(targetViewId) {
    Object.keys(this.views).forEach(key => {
      const v = this.views[key];
      if (!v) return;
      if (key === targetViewId) {
        v.classList.add('active');
        v.scrollTop = 0;
        v.scrollLeft = 0;
      } else {
        v.classList.remove('active');
      }
    });

    // Notify window for layout refreshes (like Three.js resize)
    window.dispatchEvent(new Event('resize'));
  }

  updateNavState(activeViewId) {
    this.navLinks.forEach(link => {
      const view = link.getAttribute('data-view');
      if (view === activeViewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}
