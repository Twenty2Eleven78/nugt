/**
 * Team Management Modals
 * Handles team name editing modals
 */

import { CustomModal } from '../shared/custom-modal.js';

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
    console.log('Team modals initialized');
  }

  /**
   * Create Team 1 modal
   */
  createTeam1Modal() {
    const modalHTML = `
      <div class="modal fade" id="fixtureModalTeam1" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Our Team Name Management</h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-12 col-md-8">
                  <div class="input-group mb-3">
                    <div>
                      <input type="text" id="team1Name" class="form-control" placeholder="Netherton">
                      <br>
                      <button class="btn btn-danger btn-custom" id="updTeam1Btn">Update Team Name</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById('fixtureModalTeam1');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize custom modal
    this.team1Modal = CustomModal.getOrCreateInstance('fixtureModalTeam1');
  }

  /**
   * Create Team 2 modal
   */
  createTeam2Modal() {
    const modalHTML = `
      <div class="modal fade" id="fixtureModalTeam2" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Opposition Name Management</h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-12 col-md-8">
                  <div class="input-group mb-3">
                    <div>
                      <input type="text" id="team2Name" class="form-control" placeholder="Opposition Team">
                      <br>
                      <button class="btn btn-danger btn-custom" id="updTeam2Btn">Update Team Name</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById('fixtureModalTeam2');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize custom modal
    this.team2Modal = CustomModal.getOrCreateInstance('fixtureModalTeam2');
  }

  /**
   * Show team 1 modal
   */
  showTeam1Modal() {
    if (this.team1Modal) {
      this.team1Modal.show();
    }
  }

  /**
   * Show team 2 modal
   */
  showTeam2Modal() {
    if (this.team2Modal) {
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
}

// Create and export instance
const teamModals = new TeamModals();
export default teamModals;