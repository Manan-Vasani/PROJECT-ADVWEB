const EventEmitter = require('events');

class TaskEvents extends EventEmitter {
  constructor() {
    super();
    this.history = [];
    this.maxHistory = 50;
    this.stats = {
      totalEmitted: 0,
      byEvent: { 'task-created': 0, 'task-deleted': 0, 'error': 0 }
    };
  }

  recordEvent(record) {
    this.history.unshift({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...record
    });
    if (this.history.length > this.maxHistory) this.history.pop();
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
    this.stats.totalEmitted = 0;
    Object.keys(this.stats.byEvent).forEach(k => { this.stats.byEvent[k] = 0; });
  }

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

module.exports = new TaskEvents();
