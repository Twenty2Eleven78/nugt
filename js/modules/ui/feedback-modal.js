/**
 * Feedback Modal
 * Handles user feedback collection
 */

import { CustomModal } from '../shared/custom-modal.js';

class FeedbackModal {
  constructor() {
    this.modal = null;
  }

  /**
   * Initialize feedback modal
   */
  init() {
    this.createModal();
    this.setupEventListeners();
    console.log('Feedback modal initialized');
  }

  /**
   * Create feedback modal
   */
  createModal() {
    const modalHTML = `
      <div class="modal fade" id="feedbackModal" tabindex="-1" aria-labelledby="feedbackModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="feedbackModalLabel">
                <i class="fa-solid fa-comments me-2"></i>App Feedback
              </h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="feedbackForm">
                <div class="mb-3">
                  <label for="feedbackType" class="form-label">Feedback Type</label>
                  <select class="form-select" id="feedbackType" required>
                    <option value="">Select feedback type...</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="improvement">Improvement Suggestion</option>
                    <option value="general">General Feedback</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="feedbackSubject" class="form-label">Subject</label>
                  <input type="text" class="form-control" id="feedbackSubject" placeholder="Brief description" required>
                </div>
                <div class="mb-3">
                  <label for="feedbackMessage" class="form-label">Message</label>
                  <textarea class="form-control" id="feedbackMessage" rows="4" placeholder="Please provide details about your feedback..." required></textarea>
                </div>
                <div class="mb-3">
                  <label for="feedbackEmail" class="form-label">Email (Optional)</label>
                  <input type="email" class="form-control" id="feedbackEmail" placeholder="your.email@example.com">
                  <small class="form-text text-muted">We'll only use this to follow up on your feedback if needed.</small>
                </div>
                <div class="d-flex justify-content-end gap-2">
                  <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-paper-plane me-2"></i>Send Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById('feedbackModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('feedbackModal');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Form submission
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'feedbackForm') {
        e.preventDefault();
        this.handleFeedbackSubmission();
      }
    });
  }

  /**
   * Handle feedback form submission
   */
  handleFeedbackSubmission() {
    const formData = this.getFeedbackFormData();
    
    if (this.validateFeedbackForm(formData)) {
      // Here you would typically send the feedback to your backend
      console.log('Feedback submitted:', formData);
      
      // Show success message
      this.showSuccessMessage();
      
      // Reset form and close modal
      this.resetForm();
      this.hide();
    }
  }

  /**
   * Get feedback form data
   * @returns {Object} Form data
   */
  getFeedbackFormData() {
    return {
      type: document.getElementById('feedbackType')?.value || '',
      subject: document.getElementById('feedbackSubject')?.value || '',
      message: document.getElementById('feedbackMessage')?.value || '',
      email: document.getElementById('feedbackEmail')?.value || '',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  /**
   * Validate feedback form
   * @param {Object} formData - Form data to validate
   * @returns {boolean} Whether form is valid
   */
  validateFeedbackForm(formData) {
    if (!formData.type) {
      this.showError('Please select a feedback type.');
      return false;
    }
    
    if (!formData.subject.trim()) {
      this.showError('Please provide a subject.');
      return false;
    }
    
    if (!formData.message.trim()) {
      this.showError('Please provide a message.');
      return false;
    }
    
    if (formData.email && !this.isValidEmail(formData.email)) {
      this.showError('Please provide a valid email address.');
      return false;
    }
    
    return true;
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    // You could integrate with your notification system here
    if (window.notificationManager) {
      window.notificationManager.success('Thank you for your feedback! We appreciate your input.');
    } else {
      alert('Thank you for your feedback! We appreciate your input.');
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    // You could integrate with your notification system here
    if (window.notificationManager) {
      window.notificationManager.error(message);
    } else {
      alert(message);
    }
  }

  /**
   * Reset feedback form
   */
  resetForm() {
    const form = document.getElementById('feedbackForm');
    if (form) {
      form.reset();
    }
  }

  /**
   * Show feedback modal
   */
  show() {
    if (this.modal) {
      this.modal.show();
    }
  }

  /**
   * Hide feedback modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }
}

// Create and export instance
const feedbackModal = new FeedbackModal();
export default feedbackModal;