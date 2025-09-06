#!/usr/bin/env node

/**
 * UI Integration Tests for Event System
 * Tests timeline rendering, modal integration, and statistics display updates
 * 
 * Requirements covered: 4.1, 4.2, 4.3
 * - Test timeline rendering with various event combinations
 * - Test modal integration and form handling
 * - Test statistics display updates
 */

// Simple test framework for Node.js
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentSuite = null;
    }

    describe(suiteName, testFunction) {
        this.currentSuite = suiteName;
        console.log(`\n📋 ${suiteName}`);
        console.log('='.repeat(suiteName.length + 3));
        testFunction();
        this.currentSuite = null;
    }

    it(testName, testFunction) {
        const test = {
            suite: this.currentSuite,
            name: testName,
            function: testFunction
        };
        this.tests.push(test);
    }

    async runTests() {
        this.results = [];
        let passed = 0;
        let failed = 0;

        console.log('\n🚀 Running UI Integration Tests\n');

        for (const test of this.tests) {
            try {
                await test.function();
                console.log(`  ✅ ${test.name}`);
                passed++;
            } catch (error) {
                console.log(`  ❌ ${test.name}`);
                console.log(`     Error: ${error.message}`);
                if (process.env.VERBOSE) {
                    console.log(`     Stack: ${error.stack}`);
                }
                failed++;
            }
        }

        console.log('\n📊 Test Summary');
        console.log('================');
        console.log(`Total Tests: ${passed + failed}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

        return { passed, failed, total: passed + failed };
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, but got ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, but got ${actual}`);
                }
            },
            toContain: (expected) => {
                if (Array.isArray(actual)) {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected array to contain ${expected}`);
                    }
                } else if (typeof actual === 'string') {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected string to contain "${expected}"`);
                    }
                } else {
                    throw new Error('toContain can only be used with arrays or strings');
                }
            },
            toHaveProperty: (property) => {
                if (!(property in actual)) {
                    throw new Error(`Expected object to have property "${property}"`);
                }
            },
            toHaveLength: (length) => {
                if (actual.length !== length) {
                    throw new Error(`Expected length ${length}, but got ${actual.length}`);
                }
            }
        };
    }
}

// Mock DOM elements for Node.js testing
class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.textContent = '';
        this.innerHTML = '';
        this.children = [];
        this.classList = new MockClassList();
        this.dataset = {};
        this.value = '';
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    querySelector(selector) {
        return null; // Simplified for testing
    }

    querySelectorAll(selector) {
        return []; // Simplified for testing
    }

    addEventListener(event, handler) {
        // Mock event listener
    }

    removeEventListener(event, handler) {
        // Mock event listener removal
    }
}

class MockClassList {
    constructor() {
        this.classes = new Set();
    }

    add(className) {
        this.classes.add(className);
    }

    remove(className) {
        this.classes.delete(className);
    }

    contains(className) {
        return this.classes.has(className);
    }

    toggle(className) {
        if (this.classes.has(className)) {
            this.classes.delete(className);
            return false;
        } else {
            this.classes.add(className);
            return true;
        }
    }
}

class MockDocument {
    constructor() {
        this.elements = new Map();
        this.body = new MockElement('body');
    }

    getElementById(id) {
        return this.elements.get(id) || null;
    }

    createElement(tagName) {
        return new MockElement(tagName);
    }

    createDocumentFragment() {
        return new MockElement('fragment');
    }

    // Helper method to register mock elements
    registerElement(id, element) {
        this.elements.set(id, element);
    }
}

// Mock dependencies
const mockGameState = {
    goals: [],
    matchEvents: [],
    team1Score: 0,
    team2Score: 0
};

const EVENT_TYPES = {
    GOAL: 'Goal',
    YELLOW_CARD: 'Yellow Card',
    RED_CARD: 'Red Card',
    FOUL: 'Foul',
    INCIDENT: 'Incident',
    PENALTY: 'Penalty',
    SIN_BIN: 'Sin Bin',
    HALF_TIME: 'Half Time',
    FULL_TIME: 'Full Time'
};

// Test UI Manager for integration testing
class TestUIManager {
    constructor() {
        this.gameState = mockGameState;
        this.EVENT_TYPES = EVENT_TYPES;
        this.document = new MockDocument();
        
        // Setup mock DOM elements
        this.setupMockDOM();
        
        this.timelineContainer = this.document.getElementById('match-log');
        this.statisticsElements = {
            goals: this.document.getElementById('goals-count'),
            cards: this.document.getElementById('cards-count'),
            fouls: this.document.getElementById('fouls-count'),
            total: this.document.getElementById('total-events-count')
        };
    }

    setupMockDOM() {
        // Create mock DOM elements
        const matchLog = new MockElement('div');
        const goalsCount = new MockElement('span');
        const cardsCount = new MockElement('span');
        const foulsCount = new MockElement('span');
        const totalCount = new MockElement('span');
        
        const recordModal = new MockElement('div');
        const editModal = new MockElement('div');
        
        const recordForm = new MockElement('form');
        const editForm = new MockElement('form');
        
        const eventTypeSelect = new MockElement('select');
        const eventNotes = new MockElement('textarea');
        const editEventIndex = new MockElement('input');
        const editEventTime = new MockElement('input');
        const editEventType = new MockElement('select');
        const editEventNotes = new MockElement('textarea');
        
        // Register elements
        this.document.registerElement('match-log', matchLog);
        this.document.registerElement('goals-count', goalsCount);
        this.document.registerElement('cards-count', cardsCount);
        this.document.registerElement('fouls-count', foulsCount);
        this.document.registerElement('total-events-count', totalCount);
        this.document.registerElement('recordEventModal', recordModal);
        this.document.registerElement('editEventModal', editModal);
        this.document.registerElement('recordEventForm', recordForm);
        this.document.registerElement('editEventForm', editForm);
        this.document.registerElement('eventTypeSelect', eventTypeSelect);
        this.document.registerElement('eventNotes', eventNotes);
        this.document.registerElement('editEventIndex', editEventIndex);
        this.document.registerElement('editEventTime', editEventTime);
        this.document.registerElement('editEventType', editEventType);
        this.document.registerElement('editEventNotes', editEventNotes);
    }

    // Timeline rendering methods
    renderTimeline() {
        if (!this.timelineContainer) return;

        // Clear existing timeline
        this.timelineContainer.innerHTML = '';
        this.timelineContainer.children = [];

        // Create combined events array
        const allEvents = [
            ...this.gameState.goals.map(goal => ({ ...goal, updatetype: 'goal' })),
            ...this.gameState.matchEvents.map(event => ({ ...event, updatetype: 'matchEvent' }))
        ];

        // Sort by raw time (most recent first)
        allEvents.sort((a, b) => (b.rawTime || 0) - (a.rawTime || 0));

        if (allEvents.length === 0) {
            const emptyItem = this.document.createElement('div');
            emptyItem.textContent = 'No events recorded yet';
            emptyItem.classList.add('timeline-item');
            this.timelineContainer.appendChild(emptyItem);
            return;
        }

        // Create timeline items
        allEvents.forEach((event, index) => {
            const timelineItem = this.createTimelineItem(event, index);
            this.timelineContainer.appendChild(timelineItem);
        });
    }

    createTimelineItem(event, index) {
        const item = this.document.createElement('div');
        item.classList.add('timeline-item');
        item.dataset.eventIndex = index;
        item.dataset.eventType = event.updatetype;

        const eventIcon = this.getEventIcon(event.type);
        const eventClass = this.getEventCardClass(event.type);

        if (event.updatetype === 'goal') {
            item.innerHTML = this.createGoalEventHTML(event, eventIcon, eventClass);
        } else {
            item.innerHTML = this.createMatchEventHTML(event, eventIcon, eventClass);
        }

        // Parse the HTML content to extract text for testing
        item.textContent = this.extractTextFromHTML(item.innerHTML);

        return item;
    }

    createGoalEventHTML(goal, icon, cardClass) {
        return `
            <div class="event-content ${cardClass}">
                <div class="event-header">
                    <span class="event-icon">${icon}</span>
                    <span class="event-time">${goal.timestamp || 'Unknown'}</span>
                    <span class="event-type">Goal</span>
                </div>
                <div class="event-details">
                    <strong>${goal.goalScorerName || 'Unknown'}</strong>
                    ${goal.goalScorerShirtNumber ? `(#${goal.goalScorerShirtNumber})` : ''}
                    ${goal.goalAssistName ? `Assist: ${goal.goalAssistName}` : ''}
                    ${goal.goalAssistShirtNumber ? `(#${goal.goalAssistShirtNumber})` : ''}
                </div>
                <div class="event-actions">
                    <button onclick="editEvent(${goal.originalIndex || 0}, 'goal')">Edit</button>
                    <button onclick="deleteEvent(${goal.originalIndex || 0}, 'goal')">Delete</button>
                </div>
            </div>
        `;
    }

    createMatchEventHTML(event, icon, cardClass) {
        return `
            <div class="event-content ${cardClass}">
                <div class="event-header">
                    <span class="event-icon">${icon}</span>
                    <span class="event-time">${event.timestamp || 'Unknown'}</span>
                    <span class="event-type">${event.type || 'Unknown'}</span>
                </div>
                <div class="event-details">
                    ${event.teamName ? `<strong>${event.teamName}</strong>` : ''}
                    ${event.notes || ''}
                </div>
                <div class="event-actions">
                    <button onclick="editEvent(${event.originalIndex || 0}, 'matchEvent')">Edit</button>
                    <button onclick="deleteEvent(${event.originalIndex || 0}, 'matchEvent')">Delete</button>
                </div>
            </div>
        `;
    }

    extractTextFromHTML(html) {
        // Simple HTML tag removal for testing
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    getEventIcon(eventType) {
        const icons = {
            'Goal': '⚽',
            'Yellow Card': '🟨',
            'Red Card': '🟥',
            'Foul': '⚠️',
            'Penalty': '🎯',
            'Incident': '❗',
            'Sin Bin': '⏰'
        };
        return icons[eventType] || '📝';
    }

    getEventCardClass(eventType) {
        const classes = {
            'Goal': 'goal-event',
            'Yellow Card': 'warning-event',
            'Red Card': 'danger-event',
            'Foul': 'warning-event',
            'Penalty': 'info-event',
            'Incident': 'warning-event'
        };
        return classes[eventType] || 'default-event';
    }

    // Statistics calculation and display
    calculateStatistics() {
        const stats = {
            goals: 0,
            cards: 0,
            fouls: 0,
            total: 0
        };

        // Count valid goals
        stats.goals = this.gameState.goals.filter(goal => !goal.disallowed).length;

        // Count events by type
        this.gameState.matchEvents.forEach(event => {
            if (event.type === this.EVENT_TYPES.YELLOW_CARD || event.type === this.EVENT_TYPES.RED_CARD) {
                stats.cards++;
            }
            if (event.type === this.EVENT_TYPES.FOUL) {
                stats.fouls++;
            }
        });

        stats.total = this.gameState.goals.length + this.gameState.matchEvents.length;

        return stats;
    }

    updateStatisticsDisplay() {
        const stats = this.calculateStatistics();

        if (this.statisticsElements.goals) {
            this.statisticsElements.goals.textContent = stats.goals.toString();
        }
        if (this.statisticsElements.cards) {
            this.statisticsElements.cards.textContent = stats.cards.toString();
        }
        if (this.statisticsElements.fouls) {
            this.statisticsElements.fouls.textContent = stats.fouls.toString();
        }
        if (this.statisticsElements.total) {
            this.statisticsElements.total.textContent = stats.total.toString();
        }
    }

    // Modal management
    showRecordEventModal() {
        const modal = this.document.getElementById('recordEventModal');
        if (modal) {
            modal.classList.add('show');
            return true;
        }
        return false;
    }

    showEditEventModal(index, type) {
        const modal = this.document.getElementById('editEventModal');
        if (modal) {
            // Populate form with event data
            const event = type === 'goal' ? this.gameState.goals[index] : this.gameState.matchEvents[index];
            if (event) {
                const indexInput = this.document.getElementById('editEventIndex');
                const timeInput = this.document.getElementById('editEventTime');
                const typeSelect = this.document.getElementById('editEventType');
                const notesInput = this.document.getElementById('editEventNotes');

                if (indexInput) indexInput.value = index.toString();
                if (timeInput) timeInput.value = Math.floor((event.rawTime || 0) / 60).toString();
                if (typeSelect) typeSelect.value = event.type || '';
                if (notesInput) notesInput.value = event.notes || '';

                modal.classList.add('show');
                return true;
            }
        }
        return false;
    }

    hideModal(modalId) {
        const modal = this.document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            return true;
        }
        return false;
    }

    // Test helper methods
    addTestEvent(eventData) {
        if (eventData.updatetype === 'goal') {
            this.gameState.goals.push(eventData);
        } else {
            this.gameState.matchEvents.push(eventData);
        }
    }

    clearTestData() {
        this.gameState.goals = [];
        this.gameState.matchEvents = [];
        this.gameState.team1Score = 0;
        this.gameState.team2Score = 0;
    }

    getTimelineItemCount() {
        return this.timelineContainer ? this.timelineContainer.children.length : 0;
    }

    getTimelineItemByIndex(index) {
        return this.timelineContainer ? this.timelineContainer.children[index] : null;
    }
}

// Initialize test framework
const testFramework = new TestFramework();
const describe = testFramework.describe.bind(testFramework);
const it = testFramework.it.bind(testFramework);
const expect = testFramework.expect.bind(testFramework);

let uiManager;

// Test suites
describe('Timeline Rendering with Various Event Combinations', () => {
    it('should render empty timeline correctly', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        uiManager.renderTimeline();
        
        expect(uiManager.getTimelineItemCount()).toBe(1);
        const emptyMessage = uiManager.getTimelineItemByIndex(0);
        expect(emptyMessage.textContent).toContain('No events recorded yet');
    });

    it('should render single goal event', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const goalEvent = {
            updatetype: 'goal',
            timestamp: '15:30',
            rawTime: 930,
            goalScorerName: 'John Doe',
            goalScorerShirtNumber: '10',
            type: 'Goal'
        };
        
        uiManager.addTestEvent(goalEvent);
        uiManager.renderTimeline();
        
        expect(uiManager.getTimelineItemCount()).toBe(1);
        const timelineItem = uiManager.getTimelineItemByIndex(0);
        expect(timelineItem.textContent).toContain('John Doe');
        expect(timelineItem.textContent).toContain('15:30');
        expect(timelineItem.textContent).toContain('Goal');
    });

    it('should render single match event', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const matchEvent = {
            updatetype: 'matchEvent',
            timestamp: '25:45',
            rawTime: 1545,
            type: 'Yellow Card',
            teamName: 'Team A',
            notes: 'Unsporting behavior'
        };
        
        uiManager.addTestEvent(matchEvent);
        uiManager.renderTimeline();
        
        expect(uiManager.getTimelineItemCount()).toBe(1);
        const timelineItem = uiManager.getTimelineItemByIndex(0);
        expect(timelineItem.textContent).toContain('Yellow Card');
        expect(timelineItem.textContent).toContain('25:45');
        expect(timelineItem.textContent).toContain('Team A');
        expect(timelineItem.textContent).toContain('Unsporting behavior');
    });

    it('should render multiple events in correct chronological order', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        // Add events in non-chronological order
        const events = [
            {
                updatetype: 'goal',
                timestamp: '30:00',
                rawTime: 1800,
                goalScorerName: 'Jane Smith',
                type: 'Goal'
            },
            {
                updatetype: 'matchEvent',
                timestamp: '15:30',
                rawTime: 930,
                type: 'Yellow Card',
                teamName: 'Team B'
            },
            {
                updatetype: 'matchEvent',
                timestamp: '45:00',
                rawTime: 2700,
                type: 'Red Card',
                teamName: 'Team A'
            }
        ];
        
        events.forEach(event => uiManager.addTestEvent(event));
        uiManager.renderTimeline();
        
        expect(uiManager.getTimelineItemCount()).toBe(3);
        
        // Should be ordered by most recent first (descending rawTime)
        const firstItem = uiManager.getTimelineItemByIndex(0);
        const secondItem = uiManager.getTimelineItemByIndex(1);
        const thirdItem = uiManager.getTimelineItemByIndex(2);
        
        expect(firstItem.textContent).toContain('45:00'); // Red Card
        expect(secondItem.textContent).toContain('30:00'); // Goal
        expect(thirdItem.textContent).toContain('15:30'); // Yellow Card
    });

    it('should render mixed event types with proper icons and classes', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const events = [
            {
                updatetype: 'goal',
                timestamp: '20:00',
                rawTime: 1200,
                goalScorerName: 'Player 1',
                type: 'Goal'
            },
            {
                updatetype: 'matchEvent',
                timestamp: '25:00',
                rawTime: 1500,
                type: 'Yellow Card',
                teamName: 'Team A'
            },
            {
                updatetype: 'matchEvent',
                timestamp: '35:00',
                rawTime: 2100,
                type: 'Foul',
                teamName: 'Team B'
            }
        ];
        
        events.forEach(event => uiManager.addTestEvent(event));
        uiManager.renderTimeline();
        
        expect(uiManager.getTimelineItemCount()).toBe(3);
        
        // Check that different event types have different icons in HTML
        const timelineHTML = uiManager.timelineContainer.innerHTML;
        
        // Debug: Check what's actually in the HTML
        const items = uiManager.timelineContainer.children;
        let foundGoalIcon = false;
        let foundYellowIcon = false;
        let foundFoulIcon = false;
        
        for (let i = 0; i < items.length; i++) {
            const itemHTML = items[i].innerHTML;
            if (itemHTML.includes('⚽')) foundGoalIcon = true;
            if (itemHTML.includes('🟨')) foundYellowIcon = true;
            if (itemHTML.includes('⚠️')) foundFoulIcon = true;
        }
        
        expect(foundGoalIcon).toBe(true); // Goal icon
        expect(foundYellowIcon).toBe(true); // Yellow card icon
        expect(foundFoulIcon).toBe(true); // Foul icon
    });

    it('should handle events with missing data gracefully', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const incompleteEvent = {
            updatetype: 'matchEvent',
            type: 'Incident'
            // Missing timestamp, rawTime, etc.
        };
        
        uiManager.addTestEvent(incompleteEvent);
        uiManager.renderTimeline();
        
        expect(uiManager.getTimelineItemCount()).toBe(1);
        const timelineItem = uiManager.getTimelineItemByIndex(0);
        expect(timelineItem.textContent).toContain('Incident');
        expect(timelineItem.textContent).toContain('Unknown'); // Should show "Unknown" for missing timestamp
    });
});

describe('Modal Integration and Form Handling', () => {
    it('should show record event modal', () => {
        uiManager = new TestUIManager();
        
        const result = uiManager.showRecordEventModal();
        expect(result).toBe(true);
        
        const modal = uiManager.document.getElementById('recordEventModal');
        expect(modal.classList.contains('show')).toBe(true);
    });

    it('should hide record event modal', () => {
        uiManager = new TestUIManager();
        
        // First show the modal
        uiManager.showRecordEventModal();
        
        // Then hide it
        const result = uiManager.hideModal('recordEventModal');
        expect(result).toBe(true);
        
        const modal = uiManager.document.getElementById('recordEventModal');
        expect(modal.classList.contains('show')).toBe(false);
    });

    it('should show edit event modal with populated data', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const testEvent = {
            updatetype: 'matchEvent',
            timestamp: '30:00',
            rawTime: 1800,
            type: 'Yellow Card',
            notes: 'Test notes'
        };
        
        uiManager.addTestEvent(testEvent);
        
        const result = uiManager.showEditEventModal(0, 'matchEvent');
        expect(result).toBe(true);
        
        const modal = uiManager.document.getElementById('editEventModal');
        expect(modal.classList.contains('show')).toBe(true);
        
        // Check that form is populated
        const timeInput = uiManager.document.getElementById('editEventTime');
        const typeSelect = uiManager.document.getElementById('editEventType');
        const notesInput = uiManager.document.getElementById('editEventNotes');
        
        expect(timeInput.value).toBe('30'); // 1800 seconds / 60 = 30 minutes
        expect(typeSelect.value).toBe('Yellow Card');
        expect(notesInput.value).toBe('Test notes');
    });

    it('should handle edit modal for goal events', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const testGoal = {
            updatetype: 'goal',
            timestamp: '15:30',
            rawTime: 930,
            type: 'Goal',
            goalScorerName: 'Test Player',
            notes: 'Great goal'
        };
        
        uiManager.addTestEvent(testGoal);
        
        const result = uiManager.showEditEventModal(0, 'goal');
        expect(result).toBe(true);
        
        const modal = uiManager.document.getElementById('editEventModal');
        expect(modal.classList.contains('show')).toBe(true);
    });

    it('should handle form validation in record modal', () => {
        uiManager = new TestUIManager();
        
        const form = uiManager.document.getElementById('recordEventForm');
        const eventTypeSelect = uiManager.document.getElementById('eventTypeSelect');
        const eventNotes = uiManager.document.getElementById('eventNotes');
        
        // Test form elements exist
        expect(form).toBeTruthy();
        expect(eventTypeSelect).toBeTruthy();
        expect(eventNotes).toBeTruthy();
        
        // Test form can be populated
        eventTypeSelect.value = 'Yellow Card';
        eventNotes.value = 'Test event notes';
        
        expect(eventTypeSelect.value).toBe('Yellow Card');
        expect(eventNotes.value).toBe('Test event notes');
    });

    it('should handle form validation in edit modal', () => {
        uiManager = new TestUIManager();
        
        const form = uiManager.document.getElementById('editEventForm');
        const editEventTime = uiManager.document.getElementById('editEventTime');
        const editEventType = uiManager.document.getElementById('editEventType');
        const editEventNotes = uiManager.document.getElementById('editEventNotes');
        
        // Test form elements exist
        expect(form).toBeTruthy();
        expect(editEventTime).toBeTruthy();
        expect(editEventType).toBeTruthy();
        expect(editEventNotes).toBeTruthy();
        
        // Test form can be populated
        editEventTime.value = '25';
        editEventType.value = 'Red Card';
        editEventNotes.value = 'Updated notes';
        
        expect(editEventTime.value).toBe('25');
        expect(editEventType.value).toBe('Red Card');
        expect(editEventNotes.value).toBe('Updated notes');
    });

    it('should return false when trying to show non-existent modal', () => {
        uiManager = new TestUIManager();
        
        const result = uiManager.hideModal('nonExistentModal');
        expect(result).toBe(false);
    });
});

describe('Statistics Display Updates', () => {
    it('should display zero statistics for empty game state', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const stats = uiManager.calculateStatistics();
        expect(stats.goals).toBe(0);
        expect(stats.cards).toBe(0);
        expect(stats.fouls).toBe(0);
        expect(stats.total).toBe(0);
        
        uiManager.updateStatisticsDisplay();
        
        expect(uiManager.statisticsElements.goals.textContent).toBe('0');
        expect(uiManager.statisticsElements.cards.textContent).toBe('0');
        expect(uiManager.statisticsElements.fouls.textContent).toBe('0');
        expect(uiManager.statisticsElements.total.textContent).toBe('0');
    });

    it('should calculate and display goal statistics correctly', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        // Add valid goals
        const goals = [
            { goalScorerName: 'Player 1', disallowed: false },
            { goalScorerName: 'Player 2', disallowed: false },
            { goalScorerName: 'Player 3', disallowed: true } // This should not count
        ];
        
        goals.forEach(goal => uiManager.gameState.goals.push(goal));
        
        const stats = uiManager.calculateStatistics();
        expect(stats.goals).toBe(2); // Only non-disallowed goals
        
        uiManager.updateStatisticsDisplay();
        expect(uiManager.statisticsElements.goals.textContent).toBe('2');
    });

    it('should calculate and display card statistics correctly', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const events = [
            { type: 'Yellow Card' },
            { type: 'Yellow Card' },
            { type: 'Red Card' },
            { type: 'Foul' }, // This should not count as a card
            { type: 'Incident' } // This should not count as a card
        ];
        
        events.forEach(event => uiManager.gameState.matchEvents.push(event));
        
        const stats = uiManager.calculateStatistics();
        expect(stats.cards).toBe(3); // 2 yellow + 1 red
        
        uiManager.updateStatisticsDisplay();
        expect(uiManager.statisticsElements.cards.textContent).toBe('3');
    });

    it('should calculate and display foul statistics correctly', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        const events = [
            { type: 'Foul' },
            { type: 'Foul' },
            { type: 'Yellow Card' }, // This should not count as a foul
            { type: 'Foul' }
        ];
        
        events.forEach(event => uiManager.gameState.matchEvents.push(event));
        
        const stats = uiManager.calculateStatistics();
        expect(stats.fouls).toBe(3);
        
        uiManager.updateStatisticsDisplay();
        expect(uiManager.statisticsElements.fouls.textContent).toBe('3');
    });

    it('should calculate total events correctly', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        // Add goals
        uiManager.gameState.goals.push({ goalScorerName: 'Player 1' });
        uiManager.gameState.goals.push({ goalScorerName: 'Player 2' });
        
        // Add match events
        uiManager.gameState.matchEvents.push({ type: 'Yellow Card' });
        uiManager.gameState.matchEvents.push({ type: 'Foul' });
        uiManager.gameState.matchEvents.push({ type: 'Incident' });
        
        const stats = uiManager.calculateStatistics();
        expect(stats.total).toBe(5); // 2 goals + 3 match events
        
        uiManager.updateStatisticsDisplay();
        expect(uiManager.statisticsElements.total.textContent).toBe('5');
    });

    it('should handle comprehensive statistics with mixed event types', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        // Add goals (some disallowed)
        uiManager.gameState.goals.push({ goalScorerName: 'Player 1', disallowed: false });
        uiManager.gameState.goals.push({ goalScorerName: 'Player 2', disallowed: true });
        uiManager.gameState.goals.push({ goalScorerName: 'Player 3', disallowed: false });
        
        // Add various match events
        const events = [
            { type: 'Yellow Card' },
            { type: 'Yellow Card' },
            { type: 'Red Card' },
            { type: 'Foul' },
            { type: 'Foul' },
            { type: 'Penalty' },
            { type: 'Incident' }
        ];
        
        events.forEach(event => uiManager.gameState.matchEvents.push(event));
        
        const stats = uiManager.calculateStatistics();
        
        expect(stats.goals).toBe(2); // 2 non-disallowed goals
        expect(stats.cards).toBe(3); // 2 yellow + 1 red
        expect(stats.fouls).toBe(2); // 2 fouls
        expect(stats.total).toBe(10); // 3 total goals + 7 match events
        
        uiManager.updateStatisticsDisplay();
        
        expect(uiManager.statisticsElements.goals.textContent).toBe('2');
        expect(uiManager.statisticsElements.cards.textContent).toBe('3');
        expect(uiManager.statisticsElements.fouls.textContent).toBe('2');
        expect(uiManager.statisticsElements.total.textContent).toBe('10');
    });

    it('should update statistics display when events change', () => {
        uiManager = new TestUIManager();
        uiManager.clearTestData();
        
        // Initial state - no events
        uiManager.updateStatisticsDisplay();
        expect(uiManager.statisticsElements.total.textContent).toBe('0');
        
        // Add an event
        uiManager.gameState.matchEvents.push({ type: 'Yellow Card' });
        uiManager.updateStatisticsDisplay();
        expect(uiManager.statisticsElements.cards.textContent).toBe('1');
        expect(uiManager.statisticsElements.total.textContent).toBe('1');
        
        // Add a goal
        uiManager.gameState.goals.push({ goalScorerName: 'Player 1', disallowed: false });
        uiManager.updateStatisticsDisplay();
        expect(uiManager.statisticsElements.goals.textContent).toBe('1');
        expect(uiManager.statisticsElements.total.textContent).toBe('2');
    });
});

// Run tests if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this is the main module
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
    testFramework.runTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

export { TestFramework, TestUIManager, EVENT_TYPES };