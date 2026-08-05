import { describe, it, expect } from "vitest";
import { signal, computed, effect } from "../src";

describe("flush", () => {
  it("reads during a sync flush are untracked (no garbage deps on the running effect)", () => {
    const source = signal("x");
    const keep = signal("y");
    const rows: Array<{
      c: ReturnType<typeof computed<string>>;
      dispose: () => void;
    }> = [];

    for (let i = 0; i < 100; i++) {
      const c = computed(() => source.value);
      rows.push({
        c,
        dispose: effect(() => {
          c.value;
          return keep.value;
        }, true),
      });
    }

    let runs = 0;
    const trig = signal(0);
    effect(() => {
      runs++;
      trig.value;
      for (const row of rows) row.c.value = null;
    }, true);

    expect(runs).toBe(1);

    for (const row of rows) row.dispose();
    expect(runs).toBe(1);
  });
});
