// Practical 10: Event-Driven Architecture - EventEmitter Instance
// Implements custom EventEmitter for asynchronous background processing without external message queues

import { EventEmitter } from 'node:events';

class TaskEvents extends EventEmitter {
  constructor() {
    super();
    // In-memory event telemetry log for verification and frontend inspection
    this.history = [];
    this.maxHistory = 50;
    this.stats = {
      totalEmitted: 0,
      byEvent: {
        'task-created': 0,
        'task-deleted': 0,
        'task-updated': 0,
        'error': 0
      }
    };
  }

  /**
   * Log an event execution record with timestamps
   */
  recordEvent(record) {
    this.history.unshift({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...record
    });

    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  /**
   * Return recent event execution telemetry
   */
  getHistory() {
    return this.history;
  }

  /**
   * Clear event telemetry
   */
  clearHistory() {
    this.history = [];
    this.stats.totalEmitted = 0;
    Object.keys(this.stats.byEvent).forEach(k => { this.stats.byEvent[k] = 0; });
  }

  /**
   * Enhanced emit with metrics tracking
   */
  emit(event, ...args) {
    this.stats.totalEmitted++;
    if (this.stats.byEvent[event] !== undefined) {
      this.stats.byEvent[event]++;
    } else {
      this.stats.byEvent[event] = 1;
    }
    return super.emit(event, ...args);
  }
}

// Singleton instance
const taskEvents = new TaskEvents();

// Increase max listeners if needed
taskEvents.setMaxListeners(20);

export default taskEvents;
