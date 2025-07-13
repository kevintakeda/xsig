// adapted from https://github.com/preactjs/signals/blob/main/packages/core/test/signal.test.tsx

import { vi, it, expect } from "vitest";
import { signal, flushSync, computed } from "../src";
import { effect } from "alien-signals";

it("should run computeds once for multiple dep changes", () => {
  const a = signal("a");
  const b = signal("b");

  const compute = vi.fn(() => {
    // debugger;
    return a.value + b.value;
  });
  const c = computed(compute);

  expect(c.value).toBe("ab");
  expect(compute).toHaveBeenCalledOnce();
  compute.mockClear();

  a.value = "aa";
  b.value = "bb";
  c.value;
  expect(compute).toHaveBeenCalledOnce();
});

it("should drop A->B->A updates", async () => {
  //     A
  //   / |
  //  B  | <- Looks like a flag doesn't it? :D
  //   \ |
  //     C
  //     |
  //     D
  const a = signal(2);

  const b = computed(() => a.value - 1);
  const c = computed(() => a.value + b.value);

  const compute = vi.fn(() => "d: " + c.value);
  const d = computed(compute);

  // Trigger read
  expect(d.value).to.equal("d: 3");
  expect(compute).toHaveBeenCalledOnce();
  compute.mockClear();

  a.value = 4;
  d.value;
  expect(compute).toHaveBeenCalledOnce();
});

it("should only update every computed once (diamond graph)", () => {
  // In this scenario "D" should only update once when "A" receives
  // an update. This is sometimes referred to as the "diamond" scenario.
  //     A
  //   /   \
  //  B     C
  //   \   /
  //     D
  const a = signal("a");
  const b = computed(() => a.value);
  const c = computed(() => a.value);

  const spy = vi.fn(() => b.value + " " + c.value);
  const d = computed(spy);

  expect(d.value).to.equal("a a");
  expect(spy).toHaveBeenCalledOnce();

  a.value = "aa";
  expect(d.value).to.equal("aa aa");
  expect(spy).toHaveBeenCalledTimes(2);
});

it("should only update every computed once (diamond graph + tail)", () => {
  // "E" will be likely updated twice if our mark+sweep logic is buggy.
  //     A
  //   /   \
  //  B     C
  //   \   /
  //     D
  //     |
  //     E
  const a = signal("a");
  const b = computed(() => a.value);
  const c = computed(() => a.value);

  const d = computed(() => b.value + " " + c.value);

  const spy = vi.fn(() => d.value);
  const e = computed(spy);

  expect(e.value).to.equal("a a");
  expect(spy).toHaveBeenCalledOnce();

  a.value = "aa";
  expect(e.value).to.equal("aa aa");
  expect(spy).toHaveBeenCalledTimes(2);
});

it("should bail out if result is the same", () => {
  // Bail out if valueue of "B" never changes
  // A->B->C
  const a = signal("a");
  const b = computed(() => {
    a.value;
    return "foo";
  });

  const spy = vi.fn(() => b.value);
  const c = computed(spy);

  expect(c.value).to.equal("foo");
  expect(spy).toHaveBeenCalledOnce();

  a.value = "aa";
  expect(c.value).to.equal("foo");
  expect(spy).toHaveBeenCalledOnce();
});

it("should only update every computed once (jagged diamond graph + tails)", () => {
  // "F" and "G" will be likely updated twice if our mark+sweep logic is buggy.
  //     A
  //   /   \
  //  B     C
  //  |     |
  //  |     D
  //   \   /
  //     E
  //   /   \
  //  F     G
  const a = signal("a");

  const b = computed(() => a.value);
  const c = computed(() => a.value);

  const d = computed(() => c.value);

  const eSpy = vi.fn(() => b.value + " " + d.value);
  const e = computed(eSpy);

  const fSpy = vi.fn(() => e.value);
  const f = computed(fSpy);
  const gSpy = vi.fn(() => e.value);
  const g = computed(gSpy);

  expect(f.value).to.equal("a a");
  expect(fSpy).toHaveBeenCalledOnce();

  expect(g.value).to.equal("a a");
  expect(gSpy).toHaveBeenCalledOnce();

  eSpy.mockClear();
  fSpy.mockClear();
  gSpy.mockClear();

  a.value = "b";

  expect(e.value).to.equal("b b");
  expect(eSpy).toHaveBeenCalledOnce();

  expect(f.value).to.equal("b b");
  expect(fSpy).toHaveBeenCalledOnce();

  expect(g.value).to.equal("b b");
  expect(gSpy).toHaveBeenCalledOnce();

  eSpy.mockClear();
  fSpy.mockClear();
  gSpy.mockClear();

  a.value = "c";

  expect(e.value).to.equal("c c");
  expect(eSpy).toHaveBeenCalledOnce();

  expect(f.value).to.equal("c c");
  expect(fSpy).toHaveBeenCalledOnce();

  expect(g.value).to.equal("c c");
  expect(gSpy).toHaveBeenCalledOnce();

  // top to bottom
  // expect(eSpy).to.have.been.calledBefore(fSpy);
  // left to right
  // expect(fSpy).to.have.been.calledBefore(gSpy);
});

it("should only subscribe to signals listened to", () => {
  //    *A
  //   /   \
  // *B     C <- we don't listen to C
  const a = signal("a");

  const b = computed(() => a.value);
  const spy = vi.fn(() => a.value);
  computed(spy);

  expect(b.value).to.equal("a");
  expect(spy).not.toHaveBeenCalled();

  a.value = "aa";
  expect(b.value).to.equal("aa");
  expect(spy).not.toHaveBeenCalled();
});

it("should only subscribe to signals listened to", () => {
  // Here both "B" and "C" are active in the beginning, but
  // "B" becomes inactive later. At that point it should
  // not receive any updates anymore.
  //    *A
  //   /   \
  // *B     D <- we don't listen to C
  //  |
  // *C
  const a = signal("a");
  const spyB = vi.fn(() => a.value);
  const b = computed(spyB);

  const spyC = vi.fn(() => b.value);
  const c = computed(spyC);

  const d = computed(() => a.value);

  let result = "";
  const unsub = effect(() => (result = c.value));
  flushSync();

  expect(result).to.equal("a");
  expect(d.value).to.equal("a");

  spyB.mockClear();
  spyC.mockClear();
  unsub(); // unsubscribe

  a.value = "aa";

  expect(spyB).not.toHaveBeenCalled();
  expect(spyC).not.toHaveBeenCalled();
  expect(d.value).to.equal("aa");
});

it("should ensure subs update even if one dep unmarks it", () => {
  // In this scenario "C" always returns the same valueue. When "A"
  // changes, "B" will update, then "C" at which point its update
  // to "D" will be unmarked. But "D" must still update because
  // "B" marked it. If "D" isn't updated, then we have a bug.
  //     A
  //   /   \
  //  B     *C <- returns same valueue every time
  //   \   /
  //     D
  const a = signal("a");
  const b = computed(() => a.value);
  const c = computed(() => {
    a.value;
    return "c";
  });
  const spy = vi.fn(() => b.value + " " + c.value);
  const d = computed(spy);
  expect(d.value).to.equal("a c");
  spy.mockClear();

  a.value = "aa";
  d.value;
  expect(spy).toHaveReturnedWith("aa c");
});

it("should ensure subs update even if two deps unmark it", () => {
  // In this scenario both "C" and "D" always return the same
  // valueue. But "E" must still update because "A"  marked it.
  // If "E" isn't updated, then we have a bug.
  //     A
  //   / | \
  //  B *C *D
  //   \ | /
  //     E
  const a = signal("a");
  const b = computed(() => a.value);
  const c = computed(() => {
    a.value;
    return "c";
  });
  const d = computed(() => {
    a.value;
    return "d";
  });
  const spy = vi.fn(() => b.value + " " + c.value + " " + d.value);
  const e = computed(spy);
  expect(e.value).to.equal("a c d");
  spy.mockClear();

  a.value = "aa";
  e.value;
  expect(spy).toHaveReturnedWith("aa c d");
});
