// Shared by the classic background script and the React UI. No browser APIs here.
(() => {
  const DEFAULT_CONFIG = { focusMinutes: 25, restMinutes: 5, cycles: 4 };

  function validateConfig(config) {
    const { focusMinutes, restMinutes, cycles } = config ?? {};
    for (const minutes of [focusMinutes, restMinutes]) {
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
        throw new Error("Focus and rest time must be between 1 and 180 minutes.");
      }
    }
    if (!Number.isInteger(cycles) || cycles < 1 || cycles > 99) {
      throw new Error("Choose between 1 and 99 cycles.");
    }
    return { focusMinutes, restMinutes, cycles };
  }

  function start(config, now = Date.now()) {
    config = validateConfig(config);
    return {
      config, status: "running", phase: "focus", cycle: 1,
      phaseStartedAt: now, endsAt: now + config.focusMinutes * 60000,
      lastRestEndedAt: null,
    };
  }

  // Advance from absolute deadlines, not interval ticks, including after sleep/restart.
  function advance(session, now = Date.now()) {
    if (!session || session.status !== "running" || now < session.endsAt) return session;
    let next = { ...session };
    while (next.status === "running" && now >= next.endsAt) {
      const boundary = next.endsAt;
      if (next.phase === "focus") {
        next.phase = "rest";
        next.lastRestEndedAt = null;
        next.phaseStartedAt = boundary;
        next.endsAt = boundary + next.config.restMinutes * 60000;
      } else {
        next.lastRestEndedAt = boundary;
        next.phase = "focus";
        next.phaseStartedAt = boundary;
        if (next.cycle >= next.config.cycles) {
          next.status = "complete";
          next.endsAt = null;
        } else {
          next.cycle += 1;
          next.endsAt = boundary + next.config.focusMinutes * 60000;
        }
      }
    }
    return next;
  }

  function isFocusOn(manualFocusOn, session) {
    return session ? session.status === "complete" || session.phase === "focus" : !!manualFocusOn;
  }

  function pause(session, now = Date.now()) {
    const current = advance(session, now);
    if (current?.status !== "running") return current;
    return { ...current, status: "paused", remainingMs: current.endsAt - now, endsAt: null };
  }

  function resume(session, now = Date.now()) {
    if (session?.status !== "paused") return session;
    const duration = (session.phase === "focus" ? session.config.focusMinutes : session.config.restMinutes) * 60000;
    return { ...session, status: "running", phaseStartedAt: now - (duration - session.remainingMs),
      endsAt: now + session.remainingMs, remainingMs: null };
  }

  function skip(session, now = Date.now()) {
    const current = advance(session, now);
    if (!current || current.status === "complete") return current;
    const next = advance({ ...current, status: "running", endsAt: now }, now);
    return current.status === "paused" ? pause(next, now) : next;
  }

  globalThis.FocusNodePomodoro = { DEFAULT_CONFIG, validateConfig, start, advance, isFocusOn, pause, resume, skip };
})();
