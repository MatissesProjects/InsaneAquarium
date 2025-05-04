export const bus = {
  _events: {},
  on(evt, fn) { (this._events[evt] ??= []).push(fn); },
  emit(evt, payload) { (this._events[evt] || []).forEach(fn => fn(payload)); },
  off(evt, fn) {
    if (this._events[evt]) {
      const i = this._events[evt].indexOf(fn);
      if (i !== -1) this._events[evt].splice(i,1);
    }
  },
};