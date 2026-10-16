import { describe, expect, it } from "vitest";
import { evaluateCleanupQueueHealth } from "../../src/lib/accounting/bookkeeping-cleanup-alert-policy";
const clean = { queued: 0, running: 0, retrying: 0, escalated: 0, expired: 0 };
describe("cleanup queue alert policy", () => {
  it("stays silent when healthy", () => expect(evaluateCleanupQueueHealth(clean)).toEqual([]));
  it("escalates expired leases", () => expect(evaluateCleanupQueueHealth({ ...clean, expired: 2 })[0].code).toBe("EXPIRED_LEASES"));
  it("escalates exhausted jobs", () => expect(evaluateCleanupQueueHealth({ ...clean, escalated: 1 })[0].severity).toBe("CRITICAL"));
  it("warns about backlog", () => expect(evaluateCleanupQueueHealth({ ...clean, queued: 90, retrying: 10 })[0].code).toBe("BACKLOG"));
  it("rejects invalid counters", () => expect(() => evaluateCleanupQueueHealth({ ...clean, queued: -1 })).toThrow("INVALID_CLEANUP_QUEUE_HEALTH"));
});
