import { describe, it, expect, vi } from "vitest";
import { signal, computed, effect, flushSync } from "../src";

describe("dispose", () => {
  it("detaches a disposed effect: upstream changes no longer reach it", () => {
    const a = signal("a");
    const spyC = vi.fn(() => a.value);
    const c = computed(spyC);
    const unsub = effect(() => c.value);
    flushSync();

    expect(spyC).toHaveBeenCalledTimes(1);

    unsub();
    a.value = "b";
    flushSync();
    expect(spyC).toHaveBeenCalledTimes(1); // detached: no re-eval

    expect(c.value).toBe("b"); // still reads fresh when asked
  });

  it("cascades disposal up the chain: unobserved intermediates unwind", () => {
    const a = signal("a");
    const spyB = vi.fn(() => a.value);
    const b = computed(spyB);
    const c = computed(() => b.value);

    c.value; // wire A -> B -> C
    expect(spyB).toHaveBeenCalledOnce();

    c.value = null; // dispose C: B is now unobserved
    spyB.mockClear();

    // B was unwound + marked stale -> a plain re-read re-executes it.
    // (a wired computed would just return its cache)
    expect(b.value).toBe("a");
    expect(spyB).toHaveBeenCalledOnce();
  });

  it("does not re-execute wired computeds on plain re-read (control)", () => {
    const a = signal("a");
    const spyB = vi.fn(() => a.value);
    const b = computed(spyB);
    const c = computed(() => b.value);

    c.value;
    spyB.mockClear();

    expect(b.value).toBe("a");
    expect(spyB).not.toHaveBeenCalled();
  });

  it("cascades disposal up all branches of a diamond", () => {
    const a = signal("a");
    const spyB = vi.fn(() => a.value);
    const spyC = vi.fn(() => a.value);
    const b = computed(spyB);
    const c = computed(spyC);
    const d = computed(() => b.value + c.value);

    d.value; // wire the diamond

    d.value = null; // dispose D: B and C are now unobserved
    spyB.mockClear();
    spyC.mockClear();

    expect(b.value).toBe("a");
    expect(c.value).toBe("a");
    expect(spyB).toHaveBeenCalledOnce(); // both were unwound
    expect(spyC).toHaveBeenCalledOnce();
  });

  it("disposing an effect unwinds the whole observed subtree", () => {
    const a = signal("a");
    const spyB = vi.fn(() => a.value);
    const spyC = vi.fn(() => b.value);
    const b = computed(spyB);
    const c = computed(spyC);
    const unsub = effect(() => c.value);
    flushSync();

    unsub();
    spyB.mockClear();
    spyC.mockClear();

    expect(c.value).toBe("a");
    expect(spyC).toHaveBeenCalledOnce(); // C unwound from B
    expect(b.value).toBe("a");
    expect(spyB).toHaveBeenCalledOnce(); // B unwound from A
    expect(a.value).toBe("a");
  });

  it("dispose is idempotent and safe on a never-read computed", () => {
    const a = signal("a");
    const b = computed(() => a.value);

    b.value = null; // never read: no sources yet
    b.value = null; // twice

    expect(b.value).toBeNull();
    expect(a.value).toBe("a");
  });

  it("unwound nodes re-subscribe and read fresh when observed again", () => {
    const a = signal("a");
    const spyB = vi.fn(() => a.value);
    const b = computed(spyB);
    const c = computed(() => b.value);

    c.value;
    spyB.mockClear();

    c.value = null; // unwinds B from A
    a.value = "b"; // A changes while B is unobserved

    // a new observer of B must get a fresh value (no stale cache)
    const d = computed(() => b.value);
    expect(d.value).toBe("b");
    expect(spyB).toHaveBeenCalledOnce();
  });
});
