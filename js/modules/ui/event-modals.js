/**
 * Event Management Modals
 * Handles event recording and editing modals
 */

import { CustomModal } from '../shared/custom-modal.js';

class EventModals {
  constructor() {
    this.recordEventModal = null;
    this.editEventModal = null;
  }

  /**
   * Initialize event modals
   */
  init() {
    this.createRecordEventModal();
    this.createEditEventModal();
    // Event modals initialized
  }

  /**
   * Create record event modal
   */
  createRecordEventModal() {
    const modalHTML = `
      <div class="modal fade" id="recordEventModal" tabindex="-1" aria-labelledby="recordEventModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="recordEventModalLabel">Record New Event</h5>
              <button type="button" class="btn btn-danger btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-times" style="font-size: 14px;"></i>
              </button>
            </div>
            <div class="modal-body">
              <form id="recordEventForm">
                <div class="mb-3">
                  <label for="eventTypeSelect" class="form-label">Event Type</label>
                  <select class="form-select" id="eventTypeSelect" required>
                    <option value="" disabled selected>Choose event type...</option>
                    <option value="Yellow Card">Yellow Card</option>
                    <option value="Red Card">Red Card</option>
                    <option value="Sin Bin">Sin Bin</option>
                    <option value="Foul">Foul</option>
                    <option value="Penalty">Penalty</option>
                    <option value="Incident">Incident</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="eventNotes" class="form-label">Notes (Optional)</label>
                  <textarea class="form-control" id="eventNotes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Record Event</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById('recordEventModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize custom modal
    this.recordEventModal = CustomModal.getOrCreateInstance('recordEventModal');
  }

  /**
   * Create edit event modal
   */
  createEditEventModal() {
    const modalHTML = `
      <div class="modal fade" id="editEventModal" tabindex="-1" aria-labelledby="editEventModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editEventModalLabel">Edit Event</h5>
              <button type="button" class="btn btn-danger btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px;">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <form id="editEventForm">
                <input type="hidden" id="editEventIndex" name="editEventIndex">
                <div class="mb-3">
                  <label for="editEventTime" class="form-label">Event Time (in minutes)</label>
                  <input type="number" class="form-control" id="editEventTime" required min="0" max="120">
                </div>
                <div class="mb-3" id="editEventTypeContainer" style="display: none;">
                  <label for="editEventType" class="form-label">Event Type</label>
                  <select class="form-select" id="editEventType">
                    <option value="Yellow Card">Yellow Card</option>
                    <option value="Red Card">Red Card</option>
                    <option value="Sin Bin">Sin Bin</option>
                    <option value="Foul">Foul</option>
                    <option value="Penalty">Penalty</option>
                    <option value="Incident">Incident</option>
                  </select>
                </div>
                <div class="mb-3" id="editEventNotesContainer" style="display: none;">
                  <label for="editEventNotes" class="form-label">Notes (Optional)</label>
                  <textarea class="form-control" id="editEventNotes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById('editEventModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize custom modal
    this.editEventModal = CustomModal.getOrCreateInstance('editEventModal');
  }

  /**
   * Show record event modal
   */
  showRecordEventModal() {
    if (this.recordEventModal) {
      this.recordEventModal.show();
    }
  }

  /**
   * Show edit event modal
   * @param {Object} eventData - Event data to edit
   */
  showEditEventModal(eventData) {
    if (this.editEventModal) {
      // Populate form with event data
      const timeInput = document.getElementById('editEventTime');
      if (timeInput && eventData) {
        timeInput.value = eventData.time || '';
      }
      
      this.editEventModal.show();
    }
  }

  /**
   * Hide record event modal
   */
  hideRecordEventModal() {
    if (this.recordEventModal) {
      this.recordEventModal.hide();
    }
  }

  /**
   * Hide edit event modal
   */
  hideEditEventModal() {
    if (this.editEventModal) {
      this.editEventModal.hide();
    }
  }

  /**
   * Reset record event form
   */
  resetRecordEventForm() {
    const form = document.getElementById('recordEventForm');
    if (form) {
      form.reset();
    }
  }

  /**
   * Get record event form data
   * @returns {Object} Form data
   */
  getRecordEventFormData() {
    const eventType = document.getElementById('eventTypeSelect')?.value;
    const notes = document.getElementById('eventNotes')?.value;
    
    return {
      eventType,
      notes: notes || ''
    };
  }

  /**
   * Get edit event form data
   * @returns {Object} Form data
   */
  getEditEventFormData() {
    const time = document.getElementById('editEventTime')?.value;
    
    return {
      time: parseInt(time) || 0
    };
  }
}

// Create and export instance
const eventModals = new EventModals();
export default eventModals;