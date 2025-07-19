/**
 * Debug Helper Service
 * @version 1.0
 */

/**
 * Save a test match to localStorage
 */
export function saveTestMatchToLocalStorage() {
  try {
    // Create a test match
    const now = Date.now();
    const matchId = `test_match_${now}`;
    
    const matchData = {
      title: 'Test Match',
      timestamp: now,
      savedAt: new Date().toISOString(),
      teams: {
        team1: {
          name: 'Netherton',
          score: 3
        },
        team2: {
          name: 'Opposition Team',
          score: 1
        }
      },
      gameState: {
        seconds: 4200,
        isSecondHalf: true,
        gameTime: 4200
      },
      goals: [
        {
          scorer: 'Player 1',
          assist: 'Player 2',
          time: 1200,
          team: 'team1'
        },
        {
          scorer: 'Player 3',
          assist: 'Player 4',
          time: 2400,
          team: 'team1'
        },
        {
          scorer: 'Player 5',
          assist: 'N/A',
          time: 3000,
          team: 'team1'
        },
        {
          scorer: 'Opposition Player',
          assist: 'N/A',
          time: 3600,
          team: 'opposition'
        }
      ],
      events: [
        {
          type: 'Yellow Card',
          time: 1800,
          notes: 'Player 6 - Rough tackle'
        },
        {
          type: 'Half Time',
          time: 2100,
          notes: ''
        },
        {
          type: 'Full Time',
          time: 4200,
          notes: ''
        }
      ],
      roster: [
        { name: 'Player 1', shirtNumber: '7' },
        { name: 'Player 2', shirtNumber: '10' },
        { name: 'Player 3', shirtNumber: '9' },
        { name: 'Player 4', shirtNumber: '8' },
        { name: 'Player 5', shirtNumber: '11' },
        { name: 'Player 6', shirtNumber: '4' }
      ]
    };
    
    // Get existing saved matches or create new object
    const savedMatches = JSON.parse(localStorage.getItem('nugt_saved_matches') || '{}');
    
    // Add the test match
    savedMatches[matchId] = matchData;
    
    // Save back to localStorage
    localStorage.setItem('nugt_saved_matches', JSON.stringify(savedMatches));
    
    console.log('Test match saved to localStorage:', matchId);
    return true;
  } catch (error) {
    console.error('Error saving test match:', error);
    return false;
  }
}