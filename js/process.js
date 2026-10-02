class ProcessView {
  constructor() {
    this.container = document.getElementById('view-process');
    if (!this.container) return;

    this.box = document.getElementById('journey-box');
    this.slides = this.container.querySelectorAll('.journey-slide');
    this.dots = this.container.querySelectorAll('.nav-dot');
    this.totalSteps = this.slides.length;

    if (this.totalSteps === 0) return;

    this.initDots();
    this.initScrub();
  }

  initDots() {
    this.dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const scrollHeight = this.container.scrollHeight - this.container.clientHeight;
        if (scrollHeight <= 0) return;
        const targetProgress = idx / (this.totalSteps - 1);
        this.container.scrollTo({
          top: targetProgress * scrollHeight,
          behavior: 'smooth'
        });
      });
    });
  }

  initScrub() {
    this.updateStep(0, 0, 0);

    let ticking = false;
    this.container.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  handleScroll() {
    const scrollHeight = this.container.scrollHeight - this.container.clientHeight;
    if (scrollHeight <= 0) return;

    const progress = Math.min(0.9999, Math.max(0, this.container.scrollTop / scrollHeight));
    const rawStep = progress * (this.totalSteps - 1);
    const currentStep = Math.floor(rawStep);
    const frac = rawStep - currentStep;

    this.updateStep(currentStep, frac, progress);
  }

  updateStep(currentStep, frac, progress) {
    // 1. Box morph/transition into 16:9 in the middle of the screen
    if (this.box) {
      // Scales smoothly into full 16:9 presence
      const boxFactor = Math.min(1, progress * 5);
      const scale = 0.95 + boxFactor * 0.05;
      const radius = 22 - boxFactor * 8;
      this.box.style.transform = `scale(${scale.toFixed(4)})`;
      this.box.style.borderRadius = `${radius.toFixed(1)}px`;
    }

    // 2. Active Dot indicator (No numbers, clean dots)
    const activeDotIndex = frac > 0.5 ? Math.min(this.totalSteps - 1, currentStep + 1) : currentStep;
    this.dots.forEach((dot, idx) => {
      if (idx === activeDotIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // 3. Slides continuous interpolation
    this.slides.forEach((slide, idx) => {
      if (idx === currentStep) {
        // Current slide transitioning out
        const opacity = Math.max(0, 1.0 - frac);
        const yOffset = -frac * 36;
        const scale = 1.0 - frac * 0.05;
        slide.style.opacity = opacity.toFixed(4);
        slide.style.transform = `translate3d(0, ${yOffset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        slide.style.pointerEvents = frac > 0.4 ? 'none' : 'auto';
        slide.classList.toggle('active', frac <= 0.4);
      } else if (idx === currentStep + 1) {
        // Next slide transitioning in
        const opacity = Math.min(1, frac);
        const yOffset = (1.0 - frac) * 36;
        const scale = 0.95 + frac * 0.05;
        slide.style.opacity = opacity.toFixed(4);
        slide.style.transform = `translate3d(0, ${yOffset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        slide.style.pointerEvents = frac > 0.6 ? 'auto' : 'none';
        slide.classList.toggle('active', frac > 0.4);
      } else {
        // Inactive slides
        slide.style.opacity = '0';
        slide.style.pointerEvents = 'none';
        slide.classList.remove('active');
        if (idx < currentStep) {
          slide.style.transform = 'translate3d(0, -40px, 0) scale(0.94)';
        } else {
          slide.style.transform = 'translate3d(0, 40px, 0) scale(0.94)';
        }
      }
    });
  }
}
