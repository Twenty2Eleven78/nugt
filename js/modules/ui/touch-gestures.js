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

    // Activate the target tab
    const targetLink = this.tabLinks[targetIndex];
    if (targetLink) {
      targetLink.click();
      this.currentTabIndex = targetIndex;
      
      // Add visual feedback
      this.showSwipeIndicator(targetIndex);
    }
  }

  updateCurrentTabIndex() {
    // Find which tab is currently active
    this.tabLinks.forEach((link, index) => {
      if (link && link.classList.contains('active')) {
        this.currentTabIndex = index;
      }
    });
  }

  showSwipeIndicator(tabIndex) {
    // Create a brief visual indicator showing which tab was activated
    const tabNames = ['Game', 'Events', 'Options'];
    const indicator = document.createElement('div');
    indicator.className = 'swipe-indicator';
    indicator.textContent = tabNames[tabIndex];
    indicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    document.body.appendChild(indicator);

    // Animate in
    requestAnimationFrame(() => {
      indicator.style.opacity = '1';
    });

    // Remove after animation
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 200);
    }, 800);
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