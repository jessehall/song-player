// Non-destructive, per-track loudness leveling through Web Audio (including iOS).
class PlaybackLeveler {
  constructor(media) { this.media = media; this.context = null; this.gain = null; this.source = null; this.db = 0; }
  setTrack(track) {
    const db = track?.leveling?.gainDb;
    this.db = Number.isFinite(db) ? Math.min(0, Math.max(-60, db)) : 0;
    if (this.gain) {
      const param = this.gain.gain;
      param.cancelScheduledValues(this.context.currentTime);
      param.setValueAtTime(10 ** (this.db / 20), this.context.currentTime);
    }
    this.media.dataset.levelingDb = String(this.db);
  }
  // Call synchronously from the user's tap, before asynchronous song loading.
  unlock() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return Promise.resolve();
    if (!this.context) {
      this.context = new Context();
      this.gain = this.context.createGain();
      this.gain.gain.value = 10 ** (this.db / 20);
      this.source = this.context.createMediaElementSource(this.media);
      this.source.connect(this.gain);
      this.gain.connect(this.context.destination);
    }
    return this.context.state !== 'running' ? this.context.resume() : Promise.resolve();
  }
}
