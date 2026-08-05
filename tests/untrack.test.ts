import { describe, it, expect, vi } from "vitest";
import { signal, computed, effect, untrack } from "../src";

describe("untrack", () => {
  it("returns the fn result and sees fresh values", () => {
    const a = signal(1);
    expect(untrack(() => a.value)).toBe(1);
    expect(untrack(() => a.value * 2)).toBe(2);
    a.value = 5;
    expect(untrack(() => a.value)).toBe(5);
  });

  it("does not track a signal read inside", () => {
    const a = signal(1);
    const spy = vi.fn(() => untrack(() => a.value));
    effect(spy, true);
    expect(spy).toHaveBeenCalledTimes(1);
    a.value = 2;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does not track a computed read inside", () => {
    const a = signal(1);
    const b = computed(() => a.value);
    const spy = vi.fn(() => untrack(() => b.value));
    effect(spy, true);
    expect(spy).toHaveBeenCalledTimes(1);
    a.value = 2;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does not create a dependency when used inside a computed", () => {
    const a = signal(1);
    const b = computed(() => untrack(() => a.value) + 1);
    expect(b.value).toBe(2);
    a.value = 5;
    expect(b.value).toBe(2);
  });

  it("restores tracking after it returns", () => {
    const a = signal(1);
    const b = signal(1);
    const spy = vi.fn(() => {
      untrack(() => a.value);
      return b.value;
    });
    effect(spy, true);
    expect(spy).toHaveBeenCalledTimes(1);
    a.value = 2;
    expect(spy).toHaveBeenCalledTimes(1);
    b.value = 3;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("can be nested", () => {
    const a = signal(1);
    let result: number | undefined;
    effect(() => {
      result = untrack(() => untrack(() => a.value));
    }, true);
    expect(result).toBe(1);
    a.value = 2;
    expect(result).toBe(1);
  });

  it("does not leak when used at top level", () => {
    const a = signal(1);
    untrack(() => a.value);
    const spy = vi.fn(() => a.value);
    effect(spy, true);
    expect(spy).toHaveBeenCalledTimes(1);
    a.value = 2;
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
