class HistoryView {
  constructor() {
    this.container = document.getElementById('view-history');
    this.progressBar = document.getElementById('history-progress');
    this.navPills = document.getElementById('experience-nav-pills');
    if (!this.container) return;

    this.sections = Array.from(this.container.querySelectorAll('.scroll-section'));
    this.currentScroll = this.container.scrollLeft;
    this.targetScroll = this.container.scrollLeft;
    this.maxScroll = 0;
    this.isRafRunning = false;
    this.ease = 0.088; // Silky smooth damping factor

    // Drag / Touch state
    this.isDragging = false;
    this.startX = 0;
    this.startScrollX = 0;
    this.lastX = 0;
    this.lastTime = 0;
    this.velocity = 0;
    this.dragThreshold = 5;
    this.hasMoved = false;

    // Active slide index
    this.activeIndex = 0;

    this.init();
  }

  init() {
    this.updateBounds();
    window.addEventListener('resize', () => {
      this.updateBounds();
      this.updateProgress();
    }, { passive: true });

    this.initWheel();
    this.initDrag();
    this.initKeyboard();
    this.initNavPills();
    this.initScrollAnimations();
    this.updateProgress();
    this.updateActiveSection();
  }

  updateBounds() {
    this.maxScroll = Math.max(0, this.container.scrollWidth - this.container.clientWidth);
    this.targetScroll = Math.max(0, Math.min(this.maxScroll, this.targetScroll));
  }

  initWheel() {
    this.container.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return; // Allow browser zoom
      e.preventDefault();

      this.updateBounds();
      if (this.maxScroll <= 0) return;

      let delta = e.deltaY;
      // If horizontal trackpad motion is prominent, prioritize it
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        delta = e.deltaX;
      }

      // Handle deltaMode (0: pixels, 1: lines, 2: pages)
      if (e.deltaMode === 1) {
        delta *= 34;
      } else if (e.deltaMode === 2) {
        delta *= window.innerHeight;
      }

      // Add smoothed impulse
      const step = delta * 1.12;
      this.targetScroll = Math.max(0, Math.min(this.maxScroll, this.targetScroll + step));
      this.requestTick();
    }, { passive: false });
  }

  initDrag() {
    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      this.updateBounds();

      this.isDragging = true;
      this.hasMoved = false;
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
      this.startX = clientX;
      this.lastX = clientX;
      this.startScrollX = this.targetScroll;
      this.lastTime = performance.now();
      this.velocity = 0;

      this.container.classList.add('is-dragging');
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
      const dx = clientX - this.startX;

      if (Math.abs(dx) > this.dragThreshold) {
        this.hasMoved = true;
      }

      const now = performance.now();
      const dt = Math.max(1, now - this.lastTime);
      const moveDelta = clientX - this.lastX;
      this.velocity = moveDelta / dt;
      this.lastX = clientX;
      this.lastTime = now;

      // Direct response during drag
      this.targetScroll = Math.max(0, Math.min(this.maxScroll, this.startScrollX - dx));
      this.currentScroll = this.targetScroll;
      this.container.scrollLeft = this.currentScroll;
      this.updateProgress();
      this.updateActiveSection();
    };

    const onPointerUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.container.classList.remove('is-dragging');

      // Momentum fling
      if (Math.abs(this.velocity) > 0.12) {
        const momentum = -this.velocity * 240;
        this.targetScroll = Math.max(0, Math.min(this.maxScroll, this.targetScroll + momentum));
        this.requestTick();
      }
    };

    // Mouse drag
    this.container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);

    // Touch drag
    this.container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        this.scrollToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.scrollToPrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.scrollToIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.scrollToIndex(this.sections.length - 1);
      } else if (e.key === ' ' && !e.shiftKey) {
        e.preventDefault();
        this.scrollToNext();
      } else if (e.key === ' ' && e.shiftKey) {
        e.preventDefault();
        this.scrollToPrev();
      }
    });
  }

  scrollToNext() {
    const nextIdx = Math.min(this.sections.length - 1, this.activeIndex + 1);
    this.scrollToIndex(nextIdx);
  }

  scrollToPrev() {
    const prevIdx = Math.max(0, this.activeIndex - 1);
    this.scrollToIndex(prevIdx);
  }

  scrollToIndex(index) {
    if (!this.sections[index]) return;
    this.updateBounds();
    const targetEl = this.sections[index];
    this.targetScroll = Math.max(0, Math.min(this.maxScroll, targetEl.offsetLeft));
    this.requestTick();
  }

  initNavPills() {
    if (!this.navPills) return;
    const dots = this.navPills.querySelectorAll('.nav-pill-dot');
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.scrollToIndex(index);
      });
    });
  }

  requestTick() {
    if (!this.isRafRunning) {
      this.isRafRunning = true;
      requestAnimationFrame(() => this.tick());
    }
  }

  tick() {
    if (this.isDragging) {
      this.isRafRunning = false;
      return;
    }

    const diff = this.targetScroll - this.currentScroll;

    if (Math.abs(diff) < 0.4) {
      this.currentScroll = this.targetScroll;
      this.container.scrollLeft = this.currentScroll;
      this.updateProgress();
      this.updateActiveSection();
      this.isRafRunning = false;
      return;
    }

    this.currentScroll += diff * this.ease;
    this.container.scrollLeft = this.currentScroll;
    this.updateProgress();
    this.updateActiveSection();

    requestAnimationFrame(() => this.tick());
  }

  updateProgress() {
    if (this.progressBar && this.maxScroll > 0) {
      const pct = (this.currentScroll / this.maxScroll) * 100;
      this.progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
  }

  updateActiveSection() {
    const scrollCenter = this.currentScroll + window.innerWidth / 2;
    let closestIdx = 0;
    let closestDist = Infinity;

    this.sections.forEach((sec, idx) => {
      const secCenter = sec.offsetLeft + sec.offsetWidth / 2;
      const dist = Math.abs(scrollCenter - secCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== this.activeIndex) {
      this.activeIndex = closestIdx;
      if (this.navPills) {
        const dots = this.navPills.querySelectorAll('.nav-pill-dot');
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === closestIdx);
        });
      }
    }
  }

  initScrollAnimations() {
    if (!this.sections.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const title = entry.target.querySelector('.section-title');
            const para = entry.target.querySelector('.section-para');
            const visual = entry.target.querySelector('.section-img, .empty-frame-inner');
            const num = entry.target.querySelector('.section-num');

            if (window.gsap) {
              gsap.fromTo(num, { opacity: 0, y: 24 }, { opacity: 0.95, y: 0, duration: 0.6, ease: 'power2.out' });
              gsap.fromTo(title, { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.68, ease: 'power2.out', delay: 0.06 });
              gsap.fromTo(para, { opacity: 0, y: 25 }, { opacity: 0.95, y: 0, duration: 0.68, ease: 'power2.out', delay: 0.12 });
              if (visual) {
                gsap.fromTo(visual, { scale: 1.05, opacity: 0.8 }, { scale: 1.0, opacity: 1, duration: 0.85, ease: 'power2.out' });
              }
            }
          }
        });
      }, { root: this.container, threshold: 0.35 });

      this.sections.forEach(s => observer.observe(s));
    }
  }
}
