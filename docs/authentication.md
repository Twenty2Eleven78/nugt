# NUFC GameTime Authentication System

## Overview

The NUFC GameTime App v3.5.1 introduces a passkey authentication system that enables user tracking and future game statistics storage. This document provides an overview of the authentication system and how it works.

## Features

- **Passkey Authentication**: Uses WebAuthn/Passkey for secure, passwordless authentication
- **User Tracking**: Tracks user sessions and app usage
- **Game Statistics**: Stores game statistics for authenticated users
- **Future API Integration**: Prepared for future server-side integration

## How It Works

### Authentication Flow

1. When the app loads, users are prompted to sign in with a passkey or register a new one
2. Users can register a new passkey by providing their name
3. Once registered, users can sign in with their passkey on subsequent visits
4. Users can also choose to continue without signing in, but their data won't be saved between sessions

### Data Storage

- Authentication data is stored locally using localStorage
- Game statistics are only saved for authenticated users
- When clearing game data, authentication data is preserved

### Statistics Tracking

- Goals, opposition goals, and match events are tracked for authenticated users
- Player statistics are aggregated across games
- A statistics dashboard provides an overview of tracked data

## Technical Implementation

### Key Components

- `auth.js`: Core authentication service using WebAuthn
- `auth-ui.js`: UI components for authentication
- `stats-tracker.js`: Game statistics tracking service
- `stats-dashboard.js`: UI for displaying statistics
- `api.js`: Service for future server-side integration

### Future Improvements

- Server-side storage for game statistics
- User profiles and team management
- Historical game data analysis
- Performance tracking and insights

## Security Considerations

- Passkeys are stored securely using the WebAuthn API
- No passwords are stored or transmitted
- Authentication data is kept separate from game data
- Future server integration will use secure API endpoints

## Usage

1. Register a passkey when prompted on first use
2. Sign in with your passkey on subsequent visits
3. View your statistics from the options tab or user profile dropdown
4. Game events are automatically tracked when you're signed in