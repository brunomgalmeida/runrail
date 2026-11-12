// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { statusAction } from './WorkflowStatus';

/* jsdom only to satisfy an import — see the note in ScheduleGaps.test.ts.
   WorkflowStatus reaches comet.ts through ./ui. */

/* ─── Status chip as the switch ────────────────────────────
   One click must mean one direction: the tooltip, the toast and the request
   all read the same derived action, so these are the three that could drift. */

describe('statusAction', () => {
  test('an enabled workflow offers to pause, and flipping it disables', () => {
    const action = statusAction(true);
    expect(action.target).toBe(false);
    expect(action.title).toBe('Pause scheduled runs');
    expect(action.toast).toMatch(/paused/);
    expect(action.tone).toBe('info');
  });

  test('a disabled workflow offers to enable, and flipping it enables', () => {
    const action = statusAction(false);
    expect(action.target).toBe(true);
    expect(action.title).toBe('Enable scheduled runs');
    expect(action.toast).toBe('Workflow enabled');
    expect(action.tone).toBe('success');
  });

  test('the toast says what actually stops, not just "disabled"', () => {
    // A paused workflow can still be run by hand, so the copy must not imply
    // the workflow itself is gone — only that schedules stop starting.
    expect(statusAction(true).toast).toContain('schedules will not start');
  });
});
