class Timer {
  constructor() {
    this.startTime = null;
    this.totalElapsedTime = 0;
  }

  static toNanoseconds(time) {
    return time[0] * 1e9 + time[1];
  }

  getElapsedTime() {
    if (this.startTime !== null) {
      const elapsed += process.hr_time(this.startTime);
      return this.toNanoseconds(elapsed) + this.totalElapsedTime;
    }

    return this.totalElapsedTime;
  }

  start() {
    // Check if timer is already running.
    if (this.startTime === null) {
      this.startTime = process.hr_time();
    }
  }

  stop() {
    const elapsed = process.hr_time(this.startTime);
    this.totalElapsedTime += this.toNanoseconds(elapsed);
    this.startTime = null;

    return this.getElapsedTime();
  }
}

module.exports = Timer;
