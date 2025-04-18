export class EventBus {
  constructor() { this.handlers = {}; }
  on(evt, cb) { (this.handlers[evt] ||= []).push(cb); }
  emit(evt, data) { (this.handlers[evt] || []).forEach(cb => cb(data)); }
}

export const bus = new EventBus();
