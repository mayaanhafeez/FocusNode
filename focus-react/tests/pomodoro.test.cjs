const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../../FocusModeWebsiteBlocker/pomodoro-core.js");
const timer = globalThis.FocusNodePomodoro;
const config = { focusMinutes: 1, restMinutes: 1, cycles: 2 };

test("validates durations and cycles", () => {
  for (const invalid of [
    { ...config, focusMinutes: 0 }, { ...config, restMinutes: 181 },
    { ...config, cycles: 0 }, { ...config, cycles: 1.5 }, { ...config, focusMinutes: NaN },
  ]) assert.throws(() => timer.start(invalid));
});

test("focus blocks, rest unblocks, the next focus re-blocks", () => {
  const start = timer.start(config, 1000);
  assert.equal(timer.isFocusOn(false, start), true);
  assert.equal(timer.advance(start, 60999), start);
  const rest = timer.advance(start, 61000);
  assert.equal(rest.phase, "rest");
  assert.equal(timer.isFocusOn(true, rest), false);
  const focus = timer.advance(rest, 121000);
  assert.equal(focus.phase, "focus");
  assert.equal(focus.cycle, 2);
  assert.equal(focus.lastRestEndedAt, 121000);
  assert.equal(timer.isFocusOn(false, focus), true);
});

test("delayed alarms catch up using original deadlines, including the final rest", () => {
  const start = timer.start(config, 1000);
  const caughtUp = timer.advance(start, 200000);
  assert.equal(caughtUp.phase, "rest");
  assert.equal(caughtUp.cycle, 2);
  assert.equal(caughtUp.endsAt, 241000);
  const complete = timer.advance(start, 99999999);
  assert.equal(complete.status, "complete");
  assert.equal(complete.lastRestEndedAt, 241000);
  assert.equal(timer.isFocusOn(false, complete), true);
  assert.equal(timer.advance(complete, 999999999), complete);
});

test("pause freezes time and preserves blocking, resume preserves progress", () => {
  const start = timer.start(config, 1000);
  const paused = timer.pause(start, 21000);
  assert.equal(paused.status, "paused");
  assert.equal(paused.remainingMs, 40000);
  assert.equal(timer.isFocusOn(false, paused), true);
  assert.equal(timer.advance(paused, 99999999), paused);
  const resumed = timer.resume(paused, 200000);
  assert.equal(resumed.endsAt, 240000);
  assert.equal(resumed.phaseStartedAt, 180000);
  const restPaused = timer.pause(timer.advance(resumed, 240000), 250000);
  assert.equal(timer.isFocusOn(true, restPaused), false);
  assert.equal(restPaused.remainingMs, 50000);
});

test("pause at a deadline first transitions to the correct phase", () => {
  const paused = timer.pause(timer.start(config, 1000), 61000);
  assert.equal(paused.phase, "rest");
  assert.equal(paused.status, "paused");
  assert.equal(paused.remainingMs, 60000);
});

test("skip advances focus/rest/cycle and finishes after final rest", () => {
  let session = timer.start(config, 1000);
  session = timer.skip(session, 2000);
  assert.equal(session.phase, "rest");
  assert.equal(session.endsAt, 62000);
  session = timer.skip(session, 3000);
  assert.equal(session.phase, "focus");
  assert.equal(session.cycle, 2);
  assert.equal(session.lastRestEndedAt, 3000);
  session = timer.skip(session, 4000);
  session = timer.skip(session, 5000);
  assert.equal(session.status, "complete");
  assert.equal(timer.isFocusOn(false, session), true);
});

test("skip while paused preserves pause in the next phase", () => {
  const paused = timer.pause(timer.start(config, 1000), 2000);
  const skipped = timer.skip(paused, 3000);
  assert.equal(skipped.status, "paused");
  assert.equal(skipped.phase, "rest");
  assert.equal(skipped.remainingMs, 60000);
  assert.equal(timer.isFocusOn(true, skipped), false);
});
