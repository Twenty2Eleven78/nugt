/**
 * Custom Modal System - Bootstrap Modal Replacement
 * Lightweight, theme-aware modal implementation
 */

class CustomModal {
    constructor(element) {
        this.element = typeof element === 'string' ? document.getElementById(element) : element;
        this.backdrop = null;
        this.isVisible = false;
        this.options = {
            backdrop: true,
            keyboard: true,
            focus: true
        };

        this.init();
    }

    init() {
        if (!this.element) return;

        // Add modal classes if not present
        if (!this.element.classList.contains('modal')) {
            this.element.classList.add('modal');
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button listeners
        const closeButtons = this.element.querySelectorAll('[data-dismiss="modal"], .btn-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.hide();
            });
        });

        // Escape key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible && this.options.keyboard) {
                this.hide();
            }
        });
    }

    show() {
        if (this.isVisible) return;

        // Dispatch show event
        const showEvent = new CustomEvent('modal.show', {
            detail: { modal: this },
            cancelable: true
        });
        this.element.dispatchEvent(showEvent);

        if (showEvent.defaultPrevented) return;

        this.isVisible = true;

        // Create backdrop
        if (this.options.backdrop) {
            this.createBackdrop();
        }

        // Show modal
        this.element.style.display = 'block';
        this.element.classList.add('show');

        // Prevent body scroll
        document.body.classList.add('modal-open');

        // Focus management
        if (this.options.focus) {
            this.element.focus();
        }

        // Animation
        requestAnimationFrame(() => {
            this.element.classList.add('modal-fade-in');
        });

        // Dispatch shown event
        setTimeout(() => {
            const shownEvent = new CustomEvent('modal.shown', {
                detail: { modal: this }
            });
            this.element.dispatchEvent(shownEvent);
        }, 150);
    }

    hide() {
        if (!this.isVisible) return;

        // Dispatch hide event
        const hideEvent = new CustomEvent('modal.hide', {
            detail: { modal: this },
            cancelable: true
        });
        this.element.dispatchEvent(hideEvent);

        if (hideEvent.defaultPrevented) return;

        this.isVisible = false;

        // Animation
        this.element.classList.add('modal-fade-out');

        setTimeout(() => {
            // Hide modal
            this.element.style.display = 'none';
            this.element.classList.remove('show', 'modal-fade-in', 'modal-fade-out');

            // Remove backdrop
            if (this.backdrop) {
                this.removeBackdrop();
            }

            // Restore body scroll
            document.body.classList.remove('modal-open');

            // Dispatch hidden event
            const hiddenEvent = new CustomEvent('modal.hidden', {
                detail: { modal: this }
            });
            this.element.dispatchEvent(hiddenEvent);
        }, 150);
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    createBackdrop() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        document.body.appendChild(this.backdrop);

        // Backdrop click listener
        this.backdrop.addEventListener('click', () => {
            if (this.options.backdrop === true) {
                this.hide();
            }
        });

        // Animate backdrop
        requestAnimationFrame(() => {
            this.backdrop.classList.add('show');
        });
    }

    removeBackdrop() {
        if (this.backdrop) {
            this.backdrop.classList.remove('show');
            setTimeout(() => {
                if (this.backdrop && this.backdrop.parentNode) {
                    this.backdrop.parentNode.removeChild(this.backdrop);
                }
                this.backdrop = null;
            }, 150);
        }
    }

    dispose() {
        this.hide();
        // Remove event listeners and cleanup
        this.element = null;
    }

    // Static methods for compatibility with Bootstrap Modal API
    static getInstance(element) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (el && el._customModal) {
            return el._customModal;
        }
        return null;
    }

    static getOrCreateInstance(element) {
        let instance = CustomModal.getInstance(element);
        if (!instance) {
            instance = new CustomModal(element);
            const el = typeof element === 'string' ? document.getElementById(element) : element;
            if (el) {
                el._customModal = instance;
            }
        }
        return instance;
    }
}

// CSS for custom modals
const modalCSS = `
/* Custom Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1055;
  display: none;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  outline: 0;
}

.modal.show {
  display: block !important;
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: var(--spacing-lg);
  pointer-events: none;
}

.modal-dialog-centered {
  display: flex;
  align-items: center;
  min-height: calc(100% - (var(--spacing-lg) * 2));
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: var(--bg-modal);
  background-clip: padding-box;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow-modal);
  outline: 0;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.15s linear;
}

.modal-backdrop.show {
  opacity: 1;
}

.modal-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-light) 100%);
  color: var(--text-light);
  border-bottom: 1px solid var(--border-color);
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.modal-title {
  margin-bottom: 0;
  line-height: 1.5;
  font-weight: 600;
  font-size: var(--font-size-lg);
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
  padding: var(--spacing-xl);
  background: var(--bg-modal);
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--bg-modal);
  border-top: 1px solid var(--border-color);
  border-bottom-right-radius: var(--border-radius);
  border-bottom-left-radius: var(--border-radius);
  gap: var(--spacing-sm);
}

/* Modal animations */
.modal-fade-in {
  animation: modalFadeIn 0.15s ease-out;
}

.modal-fade-out {
  animation: modalFadeOut 0.15s ease-in;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translate(0, -50px);
  }
  to {
    opacity: 1;
    transform: translate(0, 0);
  }
}

@keyframes modalFadeOut {
  from {
    opacity: 1;
    transform: translate(0, 0);
  }
  to {
    opacity: 0;
    transform: translate(0, -50px);
  }
}

/* Prevent body scroll when modal is open */
body.modal-open {
  overflow: hidden;
  padding-right: 0 !important;
}

/* Responsive modal */
@media (min-width: 576px) {
  .modal-dialog {
    max-width: 500px;
    margin: var(--spacing-xl) auto;
  }
}

@media (min-width: 992px) {
  .modal-lg {
    max-width: 800px;
  }
}

/* Tab panes for custom navigation */
.tab-content > .tab-pane {
  display: none;
}

.tab-content > .tab-pane.active,
.tab-content > .tab-pane.show {
  display: block;
}

.fade {
  transition: opacity 0.15s linear;
}

.fade:not(.show) {
  opacity: 0;
}
`;

// Inject modal CSS
if (!document.getElementById('custom-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'custom-modal-styles';
    style.textContent = modalCSS;
    document.head.appendChild(style);
}

// Custom Tab System
class CustomTabs {
    static init() {
        // Handle tab navigation
        document.addEventListener('click', (e) => {
            const tabLink = e.target.closest('[data-toggle="pill"], [data-toggle="tab"]');
            if (tabLink) {
                e.preventDefault();
                CustomTabs.showTab(tabLink);
            }
        });
    }

    static showTab(tabLink) {
        const targetId = tabLink.getAttribute('href');
        if (!targetId) return;

        const targetPane = document.querySelector(targetId);
        if (!targetPane) return;

        // Remove active class from all tabs in the same nav
        const nav = tabLink.closest('.nav');
        if (nav) {
            nav.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
        }

        // Add active class to clicked tab
        tabLink.classList.add('active');

        // Hide all tab panes in the same container
        const tabContent = targetPane.closest('.tab-content');
        if (tabContent) {
            tabContent.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active', 'show');
            });
        }

        // Show target pane
        targetPane.classList.add('active', 'show');

        // Dispatch tab change event
        const tabEvent = new CustomEvent('tab.shown', {
            detail: { tab: tabLink, pane: targetPane }
        });
        tabLink.dispatchEvent(tabEvent);
    }
}

// Initialize tabs
CustomTabs.init();

// Export for use
export { CustomModal, CustomTabs };

// Global compatibility layer
window.CustomModal = CustomModal;
window.CustomTabs = CustomTabs;

// Bootstrap compatibility layer
if (!window.bootstrap) {
    window.bootstrap = {
        Modal: CustomModal
    };
}