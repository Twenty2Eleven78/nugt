/**
 * Touch Gestures Module
 * Handles swipe gestures for tab navigation
 * @version 1.0
 */

class TouchGestures {
  constructor() {
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.minSwipeDistance = 50;
    this.maxVerticalDistance = 100;
    this.isEnabled = true;
    this.currentTabIndex = 0;
    this.tabs = ['gametab', 'gamelogtab', 'optionstab'];
    this.tabLinks = [];

    this.init();
  }

  init() {
    // Get tab links
    this.tabLinks = [
      document.querySelector('a[href="#gametab"]'),
      document.querySelector('a[href="#gamelogtab"]'),
      document.querySelector('a[href="#optionstab"]')
    ];

    // Find current active tab
    this.updateCurrentTabIndex();

    // Add touch event listeners to the main container
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      mainContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      mainContainer.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    // Listen for tab changes to update current index
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-toggle="pill"]')) {
        setTimeout(() => this.updateCurrentTabIndex(), 100);
      }
    });

    console.log('Touch gestures initialized for tab navigation');
  }

  handleTouchStart(e) {
    if (!this.isEnabled) return;

    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
  }

  handleTouchEnd(e) {
    if (!this.isEnabled) return;

    const touch = e.changedTouches[0];
    this.endX = touch.clientX;
    this.endY = touch.clientY;

    this.handleSwipe();
  }

  handleSwipe() {
    const deltaX = this.endX - this.startX;
    const deltaY = Math.abs(this.endY - this.startY);

    // Check if it's a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) < this.minSwipeDistance || deltaY > this.maxVerticalDistance) {
      return;
    }

    // Determine swipe direction and navigate
    if (deltaX > 0) {
      // Swipe right - go to previous tab
      this.navigateToTab(this.currentTabIndex - 1);
    } else {
      // Swipe left - go to next tab
      this.navigateToTab(this.currentTabIndex + 1);
    }
  }

  navigateToTab(targetIndex) {
    // Wrap around if needed
    if (targetIndex < 0) {
      targetIndex = this.tabs.length - 1;
    } else if (targetIndex >= this.tabs.length) {
      targetIndex = 0;
    }

    // Don't navigate if already on target tab
    if (targetIndex === this.currentTabIndex) {
      return;
    }

    // Determine slide direction
    const isMovingRight = targetIndex > this.currentTabIndex ||
      (this.currentTabIndex === this.tabs.length - 1 && targetIndex === 0);

    // Perform animated tab transition
    this.animateTabTransition(this.currentTabIndex, targetIndex, isMovingRight);

    // Update current index
    this.currentTabIndex = targetIndex;
  }

  animateTabTransition(fromIndex, toIndex, isMovingRight) {
    const fromTab = document.getElementById(this.tabs[fromIndex]);
    const toTab = document.getElementById(this.tabs[toIndex]);
    const fromLink = this.tabLinks[fromIndex];
    const toLink = this.tabLinks[toIndex];

    if (!fromTab || !toTab || !fromLink || !toLink) return;

    // Disable gestures during animation
    this.temporaryDisable(350);

    // Set up animation classes
    const outClass = isMovingRight ? 'slide-out-left' : 'slide-out-right';
    const inClass = isMovingRight ? 'slide-in-right' : 'slide-in-left';

    // Update tab link states immediately
    fromLink.classList.remove('active');
    toLink.classList.add('active');

    // Prepare target tab for animation
    toTab.classList.add('show', 'active');
    toTab.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');

    // Start animations
    requestAnimationFrame(() => {
      // Animate out current tab
      fromTab.classList.add(outClass);

      // Animate in target tab
      toTab.classList.add(inClass);
    });

    // Clean up after animation
    setTimeout(() => {
      // Remove animation classes
      fromTab.classList.remove('show', 'active', outClass);
      toTab.classList.remove(inClass);

      // Ensure proper final state
      fromTab.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
      toTab.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
    }, 320);
  }

  updateCurrentTabIndex() {
    // Find which tab is currently active
    this.tabLinks.forEach((link, index) => {
      if (link && link.classList.contains('active')) {
        this.currentTabIndex = index;
      }
    });
  }



  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  // Method to temporarily disable gestures (useful for modals, etc.)
  temporaryDisable(duration = 1000) {
    this.disable();
    setTimeout(() => this.enable(), duration);
  }
}

// Create and export singleton instance
export const touchGestures = new TouchGestures();