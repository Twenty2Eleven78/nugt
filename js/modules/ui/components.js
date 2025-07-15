/**
 * UI Components and Utilities
 * @version 3.3
 */

import { EVENT_TYPES } from '../shared/constants.js';

// Event icon mapping
export function getEventIcon(eventType) {
  const iconMap = {
    [EVENT_TYPES.YELLOW_CARD]: '🟨',
    [EVENT_TYPES.RED_CARD]: '🟥',
    [EVENT_TYPES.SIN_BIN]: '⏰',
    [EVENT_TYPES.FOUL]: '⚠️',
    [EVENT_TYPES.PENALTY]: '⚽',
    [EVENT_TYPES.INCIDENT]: '📝',
    [EVENT_TYPES.HALF_TIME]: '⏸️',
    [EVENT_TYPES.FULL_TIME]: '🏁'
  };
  return iconMap[eventType] || '📝';
}

// Event card class mapping
export function getEventCardClass(eventType) {
  const classMap = {
    [EVENT_TYPES.YELLOW_CARD]: 'border-warning border-2',
    [EVENT_TYPES.RED_CARD]: 'border-danger border-2',
    [EVENT_TYPES.SIN_BIN]: 'border-info border-2',
    [EVENT_TYPES.FOUL]: 'border-warning border-2',
    [EVENT_TYPES.PENALTY]: 'border-primary border-2',
    [EVENT_TYPES.INCIDENT]: 'border-secondary border-2',
    [EVENT_TYPES.HALF_TIME]: 'border-info border-2',
    [EVENT_TYPES.FULL_TIME]: 'border-success border-2'
  };
  return classMap[eventType] || 'border-secondary border-2';
}

// Loading spinner component
export function createLoadingSpinner(size = 'sm') {
  const spinner = document.createElement('div');
  spinner.className = `spinner-border spinner-border-${size}`;
  spinner.setAttribute('role', 'status');
  spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
  return spinner;
}

// Alert component
export function createAlert(message, type = 'info', dismissible = true) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}${dismissible ? ' alert-dismissible' : ''}`;
  alert.setAttribute('role', 'alert');
  
  alert.innerHTML = `
    ${message}
    ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' : ''}
  `;
  
  return alert;
}

// Badge component
export function createBadge(text, type = 'secondary') {
  const badge = document.createElement('span');
  badge.className = `badge bg-${type}`;
  badge.textContent = text;
  return badge;
}

// Button with loading state
export function setButtonLoading(button, loading = true, originalText = null) {
  if (!button) return;
  
  if (loading) {
    button.disabled = true;
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }
    const spinner = createLoadingSpinner();
    button.innerHTML = '';
    button.appendChild(spinner);
    button.appendChild(document.createTextNode(' Loading...'));
  } else {
    button.disabled = false;
    button.innerHTML = originalText || button.dataset.originalText || 'Submit';
    delete button.dataset.originalText;
  }
}

// Tooltip initialization
export function initializeTooltips(selector = '[data-bs-toggle="tooltip"]') {
  const tooltipTriggerList = document.querySelectorAll(selector);
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => 
    new bootstrap.Tooltip(tooltipTriggerEl)
  );
  return tooltipList;
}

// Form validation helper
export function validateForm(form) {
  if (!form) return false;
  
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      isValid = false;
    } else {
      field.classList.remove('is-invalid');
    }
  });
  
  return isValid;
}

// Smooth scroll to element
export function scrollToElement(element, offset = 0) {
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}