import type { SerializableDirectionsResult } from '../types/maps';

const STORAGE_KEYS = {
  CURRENT_TOUR: 'stours_current_tour',
  TOUR_HISTORY: 'stours_history',
} as const;

interface StoredTourState {
  selectedRoute: {
    response: SerializableDirectionsResult;
    estimatedTime: number;
    distance: number;
  };
  duration: number;
  timestamp: number;
}

/**
 * Save the current tour state to localStorage
 */
export function saveTourState(state: Omit<StoredTourState, 'timestamp'>): void {
  try {
    const storedState: StoredTourState = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_TOUR, JSON.stringify(storedState));
    
    // Also save to history
    const history = getTourHistory();
    history.unshift(storedState);
    // Keep only last 5 tours
    if (history.length > 5) {
      history.pop();
    }
    localStorage.setItem(STORAGE_KEYS.TOUR_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving tour state:', error);
  }
}

/**
 * Load the current tour state from localStorage
 */
export function loadTourState(): StoredTourState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_TOUR);
    if (!stored) return null;
    
    const state = JSON.parse(stored) as StoredTourState;
    // Only return state if it's less than 24 hours old
    if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_TOUR);
      return null;
    }
    return state;
  } catch (error) {
    console.error('Error loading tour state:', error);
    return null;
  }
}

/**
 * Get the tour history from localStorage
 */
export function getTourHistory(): StoredTourState[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TOUR_HISTORY);
    if (!stored) return [];
    return JSON.parse(stored) as StoredTourState[];
  } catch (error) {
    console.error('Error loading tour history:', error);
    return [];
  }
}

/**
 * Clear all stored tour data
 */
export function clearTourData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TOUR);
    localStorage.removeItem(STORAGE_KEYS.TOUR_HISTORY);
  } catch (error) {
    console.error('Error clearing tour data:', error);
  }
}
