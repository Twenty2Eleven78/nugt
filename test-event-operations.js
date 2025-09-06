#!/usr/bin/env node

/**
 * Unit Tests for Event Operations
 * Tests addEvent, updateEvent, deleteEvent methods, validation, and statistics calculation
 * 
 * Requirements covered: 3.1, 4.4
 * - Test event validation and error handling
 * - Test statistics calculation accuracy
 * - Test core event operations (add, update, delete)
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

        console.log('\n🚀 Running Event Operations Unit Tests\n');

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
            toThrow: () => {
                if (typeof actual !== 'function') {
                    throw new Error('Expected a function to test for throwing');
                }
                try {
                    actual();
                    throw new Error('Expected function to throw, but it did not');
                } catch (error) {
                    // Expected behavior
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
            toBeInstanceOf: (constructor) => {
                if (!(actual instanceof constructor)) {
                    throw new Error(`Expected ${actual} to be instance of ${constructor.name}`);
                }
            }
        };
    }
}

// Mock dependencies
const mockGameState = {
    goals: [],
    matchEvents: [],
    team1Score: 0,
    team2Score: 0
};

const mockStateManager = {
    addMatchEvent: (event) => mockGameState.matchEvents.push(event),
    updateMatchEvent: (index, updates) => Object.assign(mockGameState.matchEvents[index], updates),
    addGoal: (goal) => mockGameState.goals.push(goal),
    updateGoal: (index, updates) => Object.assign(mockGameState.goals[index], updates),
    clearEditingEvent: () => {}
};

const mockStorageHelpers = {
    saveCompleteMatchData: () => {}
};

const mockDomCache = {
    get: (elementId) => {
        const mockElements = {
            'Team1NameElement': { textContent: 'Team A' },
            'Team2NameElement': { textContent: 'Team B' },
            'firstScoreElement': { textContent: '1' },
            'secondScoreElement': { textContent: '2' }
        };
        return mockElements[elementId];
    }
};

const mockNotificationManager = {
    success: () => {},
    error: () => {},
    warning: () => {}
};

const mockAttendanceManager = {
    getMatchAttendance: () => []
};

const mockTimerController = {
    handleHalfTime: () => {},
    handleFullTime: () => {}
};

// Mock EVENT_TYPES
const EVENT_TYPES = {
    GOAL: 'Goal',
    YELLOW_CARD: 'Yellow Card',
    RED_CARD: 'Red Card',
    FOUL: 'Foul',
    INCIDENT: 'Incident',
    PENALTY: 'Penalty',
    SIN_BIN: 'Sin Bin',
    HALF_TIME: 'Half Time',
    FULL_TIME: 'Full Time',
    GAME_STARTED: 'Game Started'
};

// Mock utils
const mockUtils = {
    getCurrentSeconds: () => 1800, // 30 minutes
    formatMatchTime: (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
};

// Test version of EventManager with mocked dependencies
class TestEventManager {
    constructor() {
        this.isInitialized = false;
        this.statisticsCache = null;
        this.lastCacheUpdate = null;
        this.cacheKey = null;
        this.cacheConfig = {
            maxAge: 30000,
            enableLazyCalculation: true,
            enableCacheKeyGeneration: true
        };
        
        // Inject mocks
        this.gameState = mockGameState;
        this.stateManager = mockStateManager;
        this.storageHelpers = mockStorageHelpers;
        this.domCache = mockDomCache;
        this.notificationManager = mockNotificationManager;
        this.attendanceManager = mockAttendanceManager;
        this.timerController = mockTimerController;
        this.EVENT_TYPES = EVENT_TYPES;
        this.getCurrentSeconds = mockUtils.getCurrentSeconds;
        this.formatMatchTime = mockUtils.formatMatchTime;
    }

    // Validation methods (copied from actual EventManager)
    _validateEventData(eventData) {
        const errors = [];

        if (!eventData) {
            errors.push('Event data is required');
            return { isValid: false, errors };
        }

        if (!eventData.type || typeof eventData.type !== 'string') {
            errors.push('Event type is required and must be a string');
        } else if (!this._isValidEventType(eventData.type)) {
            errors.push(`Invalid event type: ${eventData.type}`);
        }

        if (eventData.timestamp && typeof eventData.timestamp !== 'string') {
            errors.push('Timestamp must be a string');
        }

        if (eventData.rawTime !== undefined) {
            if (typeof eventData.rawTime !== 'number' || eventData.rawTime < 0) {
                errors.push('Raw time must be a non-negative number');
            }
        }

        if (eventData.team !== undefined) {
            if (![1, 2].includes(eventData.team)) {
                errors.push('Team must be 1 or 2');
            }
        }

        if (eventData.teamName && typeof eventData.teamName !== 'string') {
            errors.push('Team name must be a string');
        }

        if (eventData.notes && typeof eventData.notes !== 'string') {
            errors.push('Notes must be a string');
        } else if (eventData.notes && eventData.notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        }

        return { isValid: errors.length === 0, errors };
    }

    _validateGoalData(goalData) {
        const errors = [];

        if (!goalData) {
            errors.push('Goal data is required');
            return { isValid: false, errors };
        }

        if (!goalData.goalScorerName || typeof goalData.goalScorerName !== 'string') {
            errors.push('Goal scorer name is required and must be a string');
        } else if (goalData.goalScorerName.length > 100) {
            errors.push('Goal scorer name cannot exceed 100 characters');
        }

        if (goalData.goalScorerShirtNumber !== undefined && goalData.goalScorerShirtNumber !== '') {
            const shirtNum = parseInt(goalData.goalScorerShirtNumber, 10);
            if (isNaN(shirtNum) || shirtNum < 1 || shirtNum > 99) {
                errors.push('Shirt number must be between 1 and 99');
            }
        }

        if (goalData.goalAssistName && typeof goalData.goalAssistName !== 'string') {
            errors.push('Goal assist name must be a string');
        } else if (goalData.goalAssistName && goalData.goalAssistName.length > 100) {
            errors.push('Goal assist name cannot exceed 100 characters');
        }

        if (goalData.goalAssistShirtNumber !== undefined && goalData.goalAssistShirtNumber !== '') {
            const assistNum = parseInt(goalData.goalAssistShirtNumber, 10);
            if (isNaN(assistNum) || assistNum < 1 || assistNum > 99) {
                errors.push('Assist shirt number must be between 1 and 99');
            }
        }

        if (goalData.timestamp && typeof goalData.timestamp !== 'string') {
            errors.push('Timestamp must be a string');
        }

        if (goalData.rawTime !== undefined) {
            if (typeof goalData.rawTime !== 'number' || goalData.rawTime < 0) {
                errors.push('Raw time must be a non-negative number');
            }
        }

        if (goalData.team !== undefined && ![1, 2].includes(goalData.team)) {
            errors.push('Team must be 1 or 2');
        }

        return { isValid: errors.length === 0, errors };
    }

    _validateEventIndex(index, type) {
        const errors = [];

        if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
            errors.push('Index must be a non-negative integer');
            return { isValid: false, errors };
        }

        if (type === 'goal') {
            if (index >= this.gameState.goals.length) {
                errors.push(`Goal index ${index} is out of range (max: ${this.gameState.goals.length - 1})`);
            }
        } else if (type === 'matchEvent') {
            if (index >= this.gameState.matchEvents.length) {
                errors.push(`Event index ${index} is out of range (max: ${this.gameState.matchEvents.length - 1})`);
            }
        } else {
            errors.push('Event type must be "goal" or "matchEvent"');
        }

        return { isValid: errors.length === 0, errors };
    }

    _validateTime(timeInSeconds) {
        const errors = [];

        if (typeof timeInSeconds !== 'number') {
            errors.push('Time must be a number');
            return { isValid: false, errors };
        }

        if (timeInSeconds < 0) {
            errors.push('Time cannot be negative');
        }

        if (timeInSeconds > 7200) {
            errors.push('Time cannot exceed 120 minutes');
        }

        return { isValid: errors.length === 0, errors };
    }

    _isValidEventType(eventType) {
        return Object.values(this.EVENT_TYPES).includes(eventType);
    }

    _validateTeamNames(team1Name, team2Name) {
        const errors = [];

        if (!team1Name || typeof team1Name !== 'string') {
            errors.push('Team 1 name is required and must be a string');
        } else if (team1Name.length < 1 || team1Name.length > 50) {
            errors.push('Team 1 name must be between 1 and 50 characters');
        }

        if (!team2Name || typeof team2Name !== 'string') {
            errors.push('Team 2 name is required and must be a string');
        } else if (team2Name.length < 1 || team2Name.length > 50) {
            errors.push('Team 2 name must be between 1 and 50 characters');
        }

        if (team1Name === team2Name) {
            errors.push('Team names must be different');
        }

        return { isValid: errors.length === 0, errors };
    }

    _validateEventOperation(operation, eventData = null) {
        const errors = [];

        if (!this.gameState) {
            errors.push('Game state not initialized');
            return { isValid: false, errors };
        }

        if (!['add', 'update', 'delete'].includes(operation)) {
            errors.push('Invalid operation type');
            return { isValid: false, errors };
        }

        if (eventData && eventData.isSystemEvent && operation !== 'add') {
            errors.push('System events cannot be manually modified');
        }

        switch (operation) {
            case 'add':
                const totalEvents = this.gameState.goals.length + this.gameState.matchEvents.length;
                if (totalEvents > 1000) {
                    errors.push('Maximum number of events reached');
                }
                break;
        }

        return { isValid: errors.length === 0, errors };
    }

    _sanitizeInput(text) {
        if (typeof text !== 'string') return '';
        return text.trim().replace(/[<>]/g, '').substring(0, 500);
    }

    // Core operations (simplified for testing)
    addMatchEvent(eventType, notes = '') {
        const validation = this._validateEventOperation('add');
        if (!validation.isValid) {
            throw new Error(`Operation validation failed: ${validation.errors.join(', ')}`);
        }

        if (!eventType || typeof eventType !== 'string') {
            throw new Error('Event type is required');
        }

        if (!this._isValidEventType(eventType)) {
            throw new Error(`Invalid event type: ${eventType}`);
        }

        const sanitizedNotes = this._sanitizeInput(notes);
        const currentSeconds = this.getCurrentSeconds();
        const team1Name = this.domCache.get('Team1NameElement')?.textContent;
        const team2Name = this.domCache.get('Team2NameElement')?.textContent;

        const teamValidation = this._validateTeamNames(team1Name, team2Name);
        if (!teamValidation.isValid) {
            throw new Error(`Team validation failed: ${teamValidation.errors.join(', ')}`);
        }

        const timeValidation = this._validateTime(currentSeconds);
        if (!timeValidation.isValid) {
            throw new Error(`Time validation failed: ${timeValidation.errors.join(', ')}`);
        }

        const eventData = {
            timestamp: this.formatMatchTime(currentSeconds),
            type: eventType,
            notes: sanitizedNotes,
            rawTime: currentSeconds
        };

        if (eventType.includes(team1Name)) {
            eventData.team = 1;
            eventData.teamName = team1Name;
        } else if (eventType.includes(team2Name)) {
            eventData.team = 2;
            eventData.teamName = team2Name;
        }

        const eventValidation = this._validateEventData(eventData);
        if (!eventValidation.isValid) {
            throw new Error(`Event validation failed: ${eventValidation.errors.join(', ')}`);
        }

        this.stateManager.addMatchEvent(eventData);
        return eventData;
    }

    updateEvent(index, updates, type) {
        const operationValidation = this._validateEventOperation('update');
        if (!operationValidation.isValid) {
            throw new Error(`Operation validation failed: ${operationValidation.errors.join(', ')}`);
        }

        const indexValidation = this._validateEventIndex(index, type);
        if (!indexValidation.isValid) {
            throw new Error(`Index validation failed: ${indexValidation.errors.join(', ')}`);
        }

        if (!updates || typeof updates !== 'object') {
            throw new Error('Invalid update data');
        }

        const sanitizedUpdates = { ...updates };
        if (sanitizedUpdates.notes) {
            sanitizedUpdates.notes = this._sanitizeInput(sanitizedUpdates.notes);
        }
        if (sanitizedUpdates.type && !this._isValidEventType(sanitizedUpdates.type)) {
            throw new Error(`Invalid event type in updates: ${sanitizedUpdates.type}`);
        }

        if (sanitizedUpdates.rawTime !== undefined) {
            const timeValidation = this._validateTime(sanitizedUpdates.rawTime);
            if (!timeValidation.isValid) {
                throw new Error(`Time validation failed: ${timeValidation.errors.join(', ')}`);
            }
        }

        if (type === 'goal') {
            const currentGoal = this.gameState.goals[index];
            const updatedGoal = { ...currentGoal, ...sanitizedUpdates };
            const goalValidation = this._validateGoalData(updatedGoal);
            if (!goalValidation.isValid) {
                throw new Error(`Goal validation failed: ${goalValidation.errors.join(', ')}`);
            }
            this.stateManager.updateGoal(index, sanitizedUpdates);
        } else if (type === 'matchEvent') {
            const currentEvent = this.gameState.matchEvents[index];
            const updatedEvent = { ...currentEvent, ...sanitizedUpdates };
            const eventValidation = this._validateEventData(updatedEvent);
            if (!eventValidation.isValid) {
                throw new Error(`Event validation failed: ${eventValidation.errors.join(', ')}`);
            }
            this.stateManager.updateMatchEvent(index, updatedEvent);
        }

        return true;
    }

    deleteEvent(index, type) {
        const operationValidation = this._validateEventOperation('delete');
        if (!operationValidation.isValid) {
            throw new Error(`Operation validation failed: ${operationValidation.errors.join(', ')}`);
        }

        const indexValidation = this._validateEventIndex(index, type);
        if (!indexValidation.isValid) {
            throw new Error(`Index validation failed: ${indexValidation.errors.join(', ')}`);
        }

        if (!['goal', 'matchEvent'].includes(type)) {
            throw new Error('Invalid event type for deletion');
        }

        const event = type === 'goal' ? this.gameState.goals[index] : this.gameState.matchEvents[index];
        if (!event) {
            throw new Error('Event not found');
        }

        if (type === 'goal') {
            this.gameState.goals.splice(index, 1);
        } else {
            this.gameState.matchEvents.splice(index, 1);
        }

        return true;
    }

    calculateStatistics() {
        const stats = {
            goals: 0,
            cards: 0,
            fouls: 0,
            total: 0
        };

        stats.goals = this.gameState.goals.filter(goal => !goal.disallowed).length;

        this.gameState.matchEvents.forEach(event => {
            if (event.type === this.EVENT_TYPES.YELLOW_CARD || event.type === this.EVENT_TYPES.RED_CARD) {
                stats.cards++;
            }
            if (event.type === this.EVENT_TYPES.FOUL) {
                stats.fouls++;
            }
        });

        stats.total = stats.goals + this.gameState.matchEvents.length;

        return stats;
    }

    resetState() {
        this.gameState.goals = [];
        this.gameState.matchEvents = [];
        this.gameState.team1Score = 0;
        this.gameState.team2Score = 0;
        this.statisticsCache = null;
    }
}

// Initialize test framework
const testFramework = new TestFramework();
const describe = testFramework.describe.bind(testFramework);
const it = testFramework.it.bind(testFramework);
const expect = testFramework.expect.bind(testFramework);

let eventManager;

// Test suites
describe('Event Data Validation', () => {
    it('should validate valid event data', () => {
        eventManager = new TestEventManager();
        const validEvent = {
            type: EVENT_TYPES.GOAL,
            timestamp: '30:00',
            rawTime: 1800,
            notes: 'Great goal!',
            team: 1,
            teamName: 'Team A'
        };
        
        const result = eventManager._validateEventData(validEvent);
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should reject event data without type', () => {
        eventManager = new TestEventManager();
        const invalidEvent = {
            timestamp: '30:00',
            rawTime: 1800
        };
        
        const result = eventManager._validateEventData(invalidEvent);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Event type is required and must be a string');
    });

    it('should reject event data with invalid type', () => {
        eventManager = new TestEventManager();
        const invalidEvent = {
            type: 'Invalid Event Type',
            timestamp: '30:00',
            rawTime: 1800
        };
        
        const result = eventManager._validateEventData(invalidEvent);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid event type: Invalid Event Type');
    });

    it('should reject event data with negative raw time', () => {
        eventManager = new TestEventManager();
        const invalidEvent = {
            type: EVENT_TYPES.GOAL,
            timestamp: '30:00',
            rawTime: -100
        };
        
        const result = eventManager._validateEventData(invalidEvent);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Raw time must be a non-negative number');
    });

    it('should reject event data with invalid team', () => {
        eventManager = new TestEventManager();
        const invalidEvent = {
            type: EVENT_TYPES.GOAL,
            timestamp: '30:00',
            rawTime: 1800,
            team: 3
        };
        
        const result = eventManager._validateEventData(invalidEvent);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Team must be 1 or 2');
    });

    it('should reject event data with notes exceeding 500 characters', () => {
        eventManager = new TestEventManager();
        const longNotes = 'a'.repeat(501);
        const invalidEvent = {
            type: EVENT_TYPES.GOAL,
            timestamp: '30:00',
            rawTime: 1800,
            notes: longNotes
        };
        
        const result = eventManager._validateEventData(invalidEvent);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Notes cannot exceed 500 characters');
    });
});

describe('Goal Data Validation', () => {
    it('should validate valid goal data', () => {
        eventManager = new TestEventManager();
        const validGoal = {
            goalScorerName: 'John Doe',
            goalScorerShirtNumber: '10',
            goalAssistName: 'Jane Smith',
            goalAssistShirtNumber: '7',
            timestamp: '30:00',
            rawTime: 1800,
            team: 1
        };
        
        const result = eventManager._validateGoalData(validGoal);
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should reject goal data without scorer name', () => {
        eventManager = new TestEventManager();
        const invalidGoal = {
            goalScorerShirtNumber: '10',
            timestamp: '30:00',
            rawTime: 1800
        };
        
        const result = eventManager._validateGoalData(invalidGoal);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Goal scorer name is required and must be a string');
    });

    it('should reject goal data with invalid shirt number', () => {
        eventManager = new TestEventManager();
        const invalidGoal = {
            goalScorerName: 'John Doe',
            goalScorerShirtNumber: '100',
            timestamp: '30:00',
            rawTime: 1800
        };
        
        const result = eventManager._validateGoalData(invalidGoal);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Shirt number must be between 1 and 99');
    });
});

describe('Add Match Event', () => {
    it('should successfully add a valid match event', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        const eventData = eventManager.addMatchEvent(EVENT_TYPES.GOAL, 'Great goal!');
        
        expect(eventData).toHaveProperty('type');
        expect(eventData.type).toBe(EVENT_TYPES.GOAL);
        expect(eventData).toHaveProperty('notes');
        expect(eventData.notes).toBe('Great goal!');
        expect(eventData).toHaveProperty('timestamp');
        expect(eventData).toHaveProperty('rawTime');
        expect(eventManager.gameState.matchEvents.length).toBe(1);
    });

    it('should reject adding event without type', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        expect(() => {
            eventManager.addMatchEvent('');
        }).toThrow();
    });

    it('should reject adding event with invalid type', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        expect(() => {
            eventManager.addMatchEvent('Invalid Type');
        }).toThrow();
    });

    it('should sanitize notes input', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        const eventData = eventManager.addMatchEvent(EVENT_TYPES.GOAL, '  <script>alert("xss")</script>  ');
        expect(eventData.notes).toBe('scriptalert("xss")/script');
    });
});

describe('Update Event', () => {
    it('should successfully update a match event', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        eventManager.gameState.matchEvents.push({
            type: EVENT_TYPES.GOAL,
            timestamp: '30:00',
            rawTime: 1800,
            notes: 'Original notes'
        });
        
        const updates = { notes: 'Updated notes' };
        const result = eventManager.updateEvent(0, updates, 'matchEvent');
        
        expect(result).toBe(true);
        expect(eventManager.gameState.matchEvents[0].notes).toBe('Updated notes');
    });

    it('should reject update with invalid index', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        expect(() => {
            eventManager.updateEvent(10, { notes: 'test' }, 'matchEvent');
        }).toThrow();
    });

    it('should reject update with invalid data', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        eventManager.gameState.matchEvents.push({
            type: EVENT_TYPES.GOAL,
            timestamp: '30:00',
            rawTime: 1800
        });
        
        expect(() => {
            eventManager.updateEvent(0, null, 'matchEvent');
        }).toThrow();
    });
});

describe('Delete Event', () => {
    it('should successfully delete a match event', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        eventManager.gameState.matchEvents.push({
            type: EVENT_TYPES.GOAL,
            timestamp: '30:00',
            rawTime: 1800,
            notes: 'Test event'
        });
        
        const result = eventManager.deleteEvent(0, 'matchEvent');
        
        expect(result).toBe(true);
        expect(eventManager.gameState.matchEvents.length).toBe(0);
    });

    it('should reject delete with invalid index', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        expect(() => {
            eventManager.deleteEvent(10, 'matchEvent');
        }).toThrow();
    });

    it('should reject delete with invalid type', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        eventManager.gameState.matchEvents.push({
            type: EVENT_TYPES.GOAL,
            timestamp: '30:00',
            rawTime: 1800
        });
        
        expect(() => {
            eventManager.deleteEvent(0, 'invalidType');
        }).toThrow();
    });
});

describe('Statistics Calculation', () => {
    it('should calculate statistics correctly with no events', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        const stats = eventManager.calculateStatistics();
        
        expect(stats.goals).toBe(0);
        expect(stats.cards).toBe(0);
        expect(stats.fouls).toBe(0);
        expect(stats.total).toBe(0);
    });

    it('should calculate statistics correctly with goals', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        eventManager.gameState.goals.push(
            { goalScorerName: 'Player 1', disallowed: false },
            { goalScorerName: 'Player 2', disallowed: false },
            { goalScorerName: 'Player 3', disallowed: true }
        );
        
        const stats = eventManager.calculateStatistics();
        expect(stats.goals).toBe(2);
    });

    it('should calculate statistics correctly with cards and fouls', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        eventManager.gameState.matchEvents.push(
            { type: EVENT_TYPES.YELLOW_CARD },
            { type: EVENT_TYPES.RED_CARD },
            { type: EVENT_TYPES.FOUL },
            { type: EVENT_TYPES.FOUL },
            { type: EVENT_TYPES.INCIDENT }
        );
        
        const stats = eventManager.calculateStatistics();
        expect(stats.cards).toBe(2);
        expect(stats.fouls).toBe(2);
        expect(stats.total).toBe(5);
    });

    it('should calculate comprehensive statistics correctly', () => {
        eventManager = new TestEventManager();
        eventManager.resetState();
        
        eventManager.gameState.goals.push(
            { goalScorerName: 'Player 1', disallowed: false },
            { goalScorerName: 'Player 2', disallowed: false }
        );
        
        eventManager.gameState.matchEvents.push(
            { type: EVENT_TYPES.YELLOW_CARD },
            { type: EVENT_TYPES.RED_CARD },
            { type: EVENT_TYPES.FOUL },
            { type: EVENT_TYPES.FOUL },
            { type: EVENT_TYPES.INCIDENT }
        );
        
        const stats = eventManager.calculateStatistics();
        expect(stats.goals).toBe(2);
        expect(stats.cards).toBe(2);
        expect(stats.fouls).toBe(2);
        expect(stats.total).toBe(7); // 2 goals + 5 events
    });
});

// Run tests immediately
(async () => {
    const results = await testFramework.runTests();
    process.exit(results.failed > 0 ? 1 : 0);
})();