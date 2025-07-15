/**
 * Modal Management
 * @version 3.3
 */

// Modal utilities
export function showModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    return modal;
  } else {
    console.warn(`Modal with ID '${modalId}' not found`);
  }
  return null;
}

export function hideModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
      // If no instance exists, create one and then hide it
      modal = new bootstrap.Modal(modalElement);
    }
    modal.hide();
    
    // Force remove backdrop if it persists
    setTimeout(() => {
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      // Ensure body classes are cleaned up
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 300);
  } else {
    console.warn(`Modal with ID '${modalId}' not found`);
  }
}

export function getModalInstance(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    return bootstrap.Modal.getInstance(modalElement);
  }
  return null;
}

// Modal event handlers
export function bindModalEvents() {
  // Release notes modal
  const releaseNotesModal = document.getElementById('releasenotesmodal');
  if (releaseNotesModal) {
    releaseNotesModal.addEventListener('show.bs.modal', loadReleaseNotes);
  }
}

// Load release notes content
function loadReleaseNotes() {
  const readmeContainer = document.getElementById('readme');
  if (readmeContainer) {
    fetch('README.md')
      .then(response => response.text())
      .then(text => {
        readmeContainer.innerHTML = text.replace(/\n/g, '<br>');
      })
      .catch(error => {
        console.error('Error loading release notes:', error);
        readmeContainer.innerHTML = '<p>Error loading release notes.</p>';
      });
  }
}