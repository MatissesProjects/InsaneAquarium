// Oh WOOOOOOOW we didnt use global state!
// You actually used a singleton pattern instead!
// *clap* *clap* *clap*
export class EventBus {
  constructor() { this.handlers = {}; }
  on(evt, cb) { (this.handlers[evt] ||= []).push(cb); }
  emit(evt, data) { (this.handlers[evt] || []).forEach(cb => cb(data)); }
}

export const bus = new EventBus();
