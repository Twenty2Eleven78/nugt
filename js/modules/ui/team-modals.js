/**
 * Team Management Modals
 * Handles team name editing modals
 */

import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';

class TeamModals {
  constructor() {
    this.team1Modal = null;
    this.team2Modal = null;
  }

  /**
   * Initialize team modals
   */
  init() {
    this.createTeam1Modal();
    this.createTeam2Modal();
    this.bindEvents();
    // Team modals initialized
  }

  /**
   * Create Team 1 modal
   */
  createTeam1Modal() {
    const bodyContent = `
      <div class="row">
        <div class="col-12 col-md-8">
          <div class="input-group mb-3">
            <div>
              <input type="text" id="team1Name" class="form-control" placeholder="Netherton">
              <br>
              <button class="btn btn-primary btn-custom" id="updTeam1Btn">Update Team Name</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create modal using factory
    createAndAppendModal(
      'fixtureModalTeam1',
      'Our Team Name Management',
      bodyContent,
      MODAL_CONFIGS.CENTERED
    );
    
    // Initialize custom modal
    this.team1Modal = CustomModal.getOrCreateInstance('fixtureModalTeam1');
  }

  /**
   * Create Team 2 modal
   */
  createTeam2Modal() {
    const bodyContent = `
      <div class="row">
        <div class="col-12 col-md-8">
          <div class="input-group mb-3">
            <div>
              <input type="text" id="team2Name" class="form-control" placeholder="Opposition Team">
              <br>
              <button class="btn btn-primary btn-custom" id="updTeam2Btn">Update Team Name</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create modal using factory
    createAndAppendModal(
      'fixtureModalTeam2',
      'Opposition Name Management',
      bodyContent,
      MODAL_CONFIGS.CENTERED
    );
    
    // Initialize custom modal
    this.team2Modal = CustomModal.getOrCreateInstance('fixtureModalTeam2');
  }

  /**
   * Show team 1 modal
   */
  showTeam1Modal() {
    if (this.team1Modal) {
      // Populate input with current team name
      setTimeout(() => {
        const team1Input = document.getElementById('team1Name');
        const team1NameElement = document.getElementById('first-team-name');
        if (team1Input && team1NameElement) {
          team1Input.value = team1NameElement.textContent;
        }
      }, 100);
      
      this.team1Modal.show();
    }
  }

  /**
   * Show team 2 modal
   */
  showTeam2Modal() {
    if (this.team2Modal) {
      // Populate input with current team name
      setTimeout(() => {
        const team2Input = document.getElementById('team2Name');
        const team2NameElement = document.getElementById('second-team-name');
        if (team2Input && team2NameElement) {
          team2Input.value = team2NameElement.textContent;
        }
      }, 100);
      
      this.team2Modal.show();
    }
  }

  /**
   * Hide team 1 modal
   */
  hideTeam1Modal() {
    if (this.team1Modal) {
      this.team1Modal.hide();
    }
  }

  /**
   * Hide team 2 modal
   */
  hideTeam2Modal() {
    if (this.team2Modal) {
      this.team2Modal.hide();
    }
  }

  /**
   * Bind event handlers for team modals
   */
  bindEvents() {
    // Use event delegation to handle dynamically created buttons
    document.addEventListener('click', (e) => {
      if (e.target.id === 'updTeam1Btn') {
        this.handleTeam1Update();
      } else if (e.target.id === 'updTeam2Btn') {
        this.handleTeam2Update();
      }
    });
  }

  /**
   * Handle team 1 name update
   */
  handleTeam1Update() {
    const team1Input = document.getElementById('team1Name');
    const team1NameElement = document.getElementById('first-team-name');
    
    if (team1Input && team1NameElement) {
      const newName = team1Input.value.trim();
      if (newName) {
        // Update the team name display
        team1NameElement.textContent = newName;
        
        // Save to localStorage if available
        if (typeof Storage !== 'undefined') {
          localStorage.setItem('nugt_team1Name', newName);
        }
        
        // Hide the modal
        this.hideTeam1Modal();
        
        // Show success notification if available
        if (window.notificationManager) {
          window.notificationManager.success(`Team name updated to "${newName}"`);
        }
      }
    }
  }

  /**
   * Handle team 2 name update
   */
  handleTeam2Update() {
    const team2Input = document.getElementById('team2Name');
    const team2NameElement = document.getElementById('second-team-name');
    
    if (team2Input && team2NameElement) {
      const newName = team2Input.value.trim();
      if (newName) {
        // Update the team name display
        team2NameElement.textContent = newName;
        
        // Save to localStorage if available
        if (typeof Storage !== 'undefined') {
          localStorage.setItem('nugt_team2Name', newName);
        }
        
        // Hide the modal
        this.hideTeam2Modal();
        
        // Show success notification if available
        if (window.notificationManager) {
          window.notificationManager.success(`Opposition name updated to "${newName}"`);
        }
      }
    }
  }
}

// Create and export instance
const teamModals = new TeamModals();
export default teamModals;