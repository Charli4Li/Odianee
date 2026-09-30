/**
 * Making Of / Process View Logic
 * Interactive 7-step card stack scrub and typography sync
 */

class ProcessView {
  constructor() {
    this.container = document.getElementById('view-process');
    if (!this.container) return;

    this.cards = this.container.querySelectorAll('.stack-card');
    this.textItems = this.container.querySelectorAll('.dynamic-text-item');
    this.totalSteps = this.cards.length;

    this.initScrub();
  }

  initScrub() {
    if (this.totalSteps === 0) return;

    // Initial positioning
    this.updateStep(0, 0);

    this.container.addEventListener('scroll', () => {
      const scrollHeight = this.container.scrollHeight - this.container.clientHeight;
      if (scrollHeight <= 0) return;

      const progress = Math.min(0.9999, Math.max(0, this.container.scrollTop / scrollHeight));
      const rawStep = progress * (this.totalSteps - 1);
      const currentStep = Math.floor(rawStep);
      const stepFraction = rawStep - currentStep;

      this.updateStep(currentStep, stepFraction);
    });
  }

  updateStep(currentStep, frac) {
    // Dynamic text items
    this.textItems.forEach((txt, idx) => {
      if (idx === currentStep) {
        txt.classList.add('active');
      } else {
        txt.classList.remove('active');
      }
    });

    // Card stack animation
    this.cards.forEach((card, idx) => {
      const img = card.querySelector('.stack-card-img');
      if (idx < currentStep) {
        // Passed cards: shrunk, tilted, hidden above
        card.style.transform = `translate3d(0, -100%, 0) scale(0.6) rotate(8deg)`;
        card.style.opacity = '0';
        card.style.zIndex = idx + 1;
        if (img) img.style.transform = `scale(1.6)`;
      } else if (idx === currentStep) {
        // Current card: scaling down and rotating slightly as frac advances
        const scale = 1.0 - frac * 0.45;
        const rotate = frac * 8;
        const yOffset = -frac * 15;
        card.style.transform = `translate3d(0, ${yOffset}%, 0) scale(${scale}) rotate(${rotate}deg)`;
        card.style.opacity = '1';
        card.style.zIndex = 10;
        if (img) img.style.transform = `scale(${1.0 + frac * 0.6})`;
      } else if (idx === currentStep + 1) {
        // Upcoming next card: sliding up from 100% to 0%
        const yPercent = (1.0 - frac) * 100;
        card.style.transform = `translate3d(0, ${yPercent}%, 0) scale(1) rotate(0deg)`;
        card.style.opacity = '1';
        card.style.zIndex = 20;
        if (img) img.style.transform = `scale(1)`;
      } else {
        // Future cards: waiting at 100% down
        card.style.transform = `translate3d(0, 100%, 0) scale(1) rotate(0deg)`;
        card.style.opacity = '0';
        card.style.zIndex = idx + 1;
        if (img) img.style.transform = `scale(1)`;
      }
    });
  }
}
