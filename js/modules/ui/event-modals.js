/**
 * Event Management Modals
 * Handles event recording and editing modals
 */

import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';

class EventModals {
  constructor() {
    this.recordEventModal = null;
    this.editEventModal = null;
    this.isSubmitting = false;
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
    const bodyContent = `
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
            <option value="Offside">Offside</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="eventTeamSelect" class="form-label">Team</label>
          <select class="form-select" id="eventTeamSelect" required>
            <option value="" disabled selected>Select team...</option>
            <option value="team1" id="team1Option">Netherton</option>
            <option value="team2" id="team2Option">Opposition</option>
          </select>
        </div>
        <div class="mb-3" id="eventNotesContainer">
          <label for="eventNotes" class="form-label">Notes</label>
          <textarea class="form-control" id="eventNotes" rows="3"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Record Event</button>
      </form>
    `;

    createAndAppendModal(
      'recordEventModal',
      '<i class="fas fa-clipboard-list me-2"></i>Record New Event',
      bodyContent,
      MODAL_CONFIGS.CENTERED
    );
    
    // Initialize custom modal
    this.recordEventModal = CustomModal.getOrCreateInstance('recordEventModal');
    
    // Add event listeners for dynamic behavior
    this.setupRecordEventListeners();
  }

  /**
   * Create edit event modal
   */
  createEditEventModal() {
    const bodyContent = `
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
            <option value="Offside">Offside</option>
          </select>
        </div>
        <div class="mb-3" id="editEventTeamContainer" style="display: none;">
          <label for="editEventTeam" class="form-label">Team</label>
          <select class="form-select" id="editEventTeam">
            <option value="team1" id="editTeam1Option">Team 1</option>
            <option value="team2" id="editTeam2Option">Team 2</option>
          </select>
        </div>
        <div class="mb-3" id="editEventNotesContainer" style="display: none;">
          <label for="editEventNotes" class="form-label">Notes</label>
          <textarea class="form-control" id="editEventNotes" rows="3"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </form>
    `;

    createAndAppendModal(
      'editEventModal',
      '<i class="fas fa-edit me-2"></i>Edit Event',
      bodyContent,
      MODAL_CONFIGS.CENTERED
    );
    
    // Initialize custom modal
    this.editEventModal = CustomModal.getOrCreateInstance('editEventModal');
    
    // Attach form submission event listener
    const editEventForm = document.getElementById('editEventForm');
    if (editEventForm) {
      editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Import the events manager dynamically to avoid circular imports
        const { combinedEventsManager } = await import('../match/combined-events.js');
        combinedEventsManager.handleEditEventFormSubmission(e);
      });
    }
  }

  /**
   * Show record event modal
   */
  showRecordEventModal() {
    if (this.recordEventModal) {
      this.updateTeamNames();
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
    const team = document.getElementById('eventTeamSelect')?.value;
    const notes = document.getElementById('eventNotes')?.value;
    
    return {
      eventType,
      team,
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

  /**
   * Setup event listeners for record event modal
   */
  setupRecordEventListeners() {
    const eventTypeSelect = document.getElementById('eventTypeSelect');
    const eventTeamSelect = document.getElementById('eventTeamSelect');
    const eventNotes = document.getElementById('eventNotes');
    const recordEventForm = document.getElementById('recordEventForm');
    
    // Remove existing listeners to prevent duplicates
    if (eventTypeSelect) {
      eventTypeSelect.removeEventListener('change', this.updateNotesField);
      eventTypeSelect.addEventListener('change', () => {
        this.updateNotesField();
      });
    }
    
    if (eventTeamSelect) {
      eventTeamSelect.removeEventListener('change', this.updateNotesField);
      eventTeamSelect.addEventListener('change', () => {
        this.updateNotesField();
      });
    }
    
    // Remove any existing form and recreate it completely
    const existingForm = document.getElementById('recordEventForm');
    if (existingForm) {
      existingForm.remove();
    }
    
    // Find the modal body and add the form
    const modalBody = document.querySelector('#recordEventModal .modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
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
              <option value="Offside">Offside</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="eventTeamSelect" class="form-label" id="eventTeamLabel">Team</label>
            <select class="form-select" id="eventTeamSelect" required>
              <option value="" disabled selected>Select team...</option>
              <option value="team1" id="team1Option">Netherton</option>
              <option value="team2" id="team2Option">Opposition</option>
            </select>
          </div>
          <div class="mb-3" id="eventNotesContainer">
            <label for="eventNotes" class="form-label">Notes</label>
            <textarea class="form-control" id="eventNotes" rows="3"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Record Event</button>
        </form>
      `;
      
      // Add event listeners to the new form
      const newForm = document.getElementById('recordEventForm');
      const eventTypeSelect = document.getElementById('eventTypeSelect');
      const eventTeamSelect = document.getElementById('eventTeamSelect');
      
      if (newForm) {
        newForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await this.handleRecordEventSubmission();
        });
      }
      
      if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', () => {
          this.updateNotesField();
        });
      }
      
      if (eventTeamSelect) {
        eventTeamSelect.addEventListener('change', () => {
          this.updateNotesField();
        });
      }
    }
  }

  /**
   * Update notes field based on event type and team selection
   */
  updateNotesField() {
    const eventType = document.getElementById('eventTypeSelect')?.value;
    const team = document.getElementById('eventTeamSelect')?.value;
    const notesField = document.getElementById('eventNotes');
    const notesContainer = document.getElementById('eventNotesContainer');
    const teamLabel = document.getElementById('eventTeamLabel');
    
    if (!eventType || !notesField) return;
    
    // Update team label and hide notes for specific event types
    if (['Foul', 'Offside', 'Penalty'].includes(eventType)) {
      if (teamLabel) teamLabel.textContent = 'Awarded to Team';
      if (notesContainer) {
        notesContainer.style.display = 'none';
      }
    } else {
      if (teamLabel) teamLabel.textContent = 'Team';
      // Show notes field for cards and sin bin with placeholder
      if (['Yellow Card', 'Red Card', 'Sin Bin'].includes(eventType)) {
        notesField.placeholder = 'Player name or shirt number';
      } else {
        notesField.placeholder = '';
      }
      notesField.readOnly = false;
      notesContainer.style.display = 'block';
    }
  }

  /**
   * Handle record event form submission
   */
  async handleRecordEventSubmission() {
    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    
    const formData = this.getRecordEventFormData();
    
    if (!formData.eventType || !formData.team) {
      this.isSubmitting = false;
      return;
    }
    
    // Generate final notes
    let finalNotes = formData.notes;
    const teamName = this.getTeamName(formData.team);
    
    if (['Foul', 'Offside', 'Penalty'].includes(formData.eventType)) {
      finalNotes = `Awarded to ${teamName}`;
    } else if (['Yellow Card', 'Red Card', 'Sin Bin'].includes(formData.eventType)) {
      finalNotes = `${teamName} - ${formData.notes}`;
    }
    
    try {
      // Import and use the events manager
      const { combinedEventsManager } = await import('../match/combined-events.js');
      combinedEventsManager.addMatchEvent(formData.eventType, finalNotes);
      
      // Reset form and hide modal
      this.resetRecordEventForm();
      this.hideRecordEventModal();
      
    } catch (error) {
      console.error('Error recording event:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Update team names in dropdowns
   */
  async updateTeamNames() {
    const { domCache } = await import('../shared/dom.js');
    const team1Name = domCache.get('Team1NameElement')?.textContent || 'Netherton';
    const team2Name = domCache.get('Team2NameElement')?.textContent || 'Opposition';
    
    // Update record modal options
    const team1Option = document.getElementById('team1Option');
    const team2Option = document.getElementById('team2Option');
    if (team1Option) team1Option.textContent = team1Name;
    if (team2Option) team2Option.textContent = team2Name;
    
    // Update edit modal options
    const editTeam1Option = document.getElementById('editTeam1Option');
    const editTeam2Option = document.getElementById('editTeam2Option');
    if (editTeam1Option) editTeam1Option.textContent = team1Name;
    if (editTeam2Option) editTeam2Option.textContent = team2Name;
  }

  /**
   * Get team name by team value
   */
  getTeamName(team) {
    if (team === 'team1') {
      return document.getElementById('Team1NameElement')?.textContent || 'Netherton';
    } else if (team === 'team2') {
      return document.getElementById('Team2NameElement')?.textContent || 'Opposition';
    }
    return 'Unknown Team';
  }
}

// Create and export instance
const eventModals = new EventModals();
export default eventModals;