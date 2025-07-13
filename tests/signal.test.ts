import { expect, test, vi, describe } from "vitest";
import { signal, effect, computed, flushSync } from "../src";

describe("state", () => {
  test("store and return a value", () => {
    const a = signal(1);
    expect(a.value).toBe(1);
  });

  test("is updating", () => {
    const a = signal(1);
    a.value = 2;
    expect(a.value).toBe(2);
  });

  test("is always updating", () => {
    const a = signal(1);
    a.value = 2;
    expect(a.value).toBe(2);
    a.value = 3;
    expect(a.value).toBe(3);
  });
});

describe("memos", () => {
  test("is caching", () => {
    const a = signal(1);
    const b = signal(2);
    const cSpy = vi.fn(() => a.value + b.value);
    const c = computed(cSpy);
    expect(c.value).toBe(3);
    expect(c.value).toBe(3);
    expect(c.value).toBe(3);
    expect(cSpy).toHaveBeenCalledTimes(1);
  });

  test("is lazy", () => {
    const a = signal("a");
    const b = signal("b");
    const cSpy = vi.fn(() => a.value + b.value);
    const c = computed(cSpy);
    a.value = "a!";
    b.value = "b!";
    expect(cSpy).toHaveBeenCalledTimes(0);
    expect(c.value).toBe("a!b!");
    expect(cSpy).toHaveBeenCalledTimes(1);
  });

  test("dynamic returns", () => {
    const a = signal(false);
    const bSpy = vi.fn(() => (a.value ? "1" : "2"));
    const b = computed(bSpy);
    expect(b.value).toBe("2");
    a.value = true;
    expect(b.value).toBe("1");
    a.value = false;
    expect(b.value).toBe("2");
    a.value = true;
    expect(b.value).toBe("1");
    expect(bSpy).toHaveBeenCalledTimes(4);
  });

  test("unsubscribe invisible dependencies", () => {
    const a = signal(false);
    const b = signal("b");
    const c = signal("c");

    const dSpy = vi.fn(() => (a.value ? b.value : c.value));
    const d = computed(dSpy);
    expect(d.value).toBe("c");

    a.value = true;
    a.value = false;
    expect(d.value).toBe("c");
    expect(dSpy).toHaveBeenCalledTimes(2);
    b.value = "b!";
    b.value = "b!!";
    expect(d.value).toBe("c");
    expect(dSpy).toHaveBeenCalledTimes(2);

    a.value = true;
    expect(d.value).toBe("b!!");
    expect(dSpy).toHaveBeenCalledTimes(3);

    c.value = "c!";
    c.value = "c!!";
    expect(d.value).toBe("b!!");
    expect(dSpy).toHaveBeenCalledTimes(3);

    a.value = false;
    expect(d.value).toBe("c!!");
    expect(dSpy).toHaveBeenCalledTimes(4);
  });
});

describe("graph", () => {
  test("diamond runs once", () => {
    const a = signal("a");
    const b = computed(() => a.value);
    const c = computed(() => a.value);

    const spy = vi.fn(() => b.value + c.value);
    const d = computed(spy);

    expect(d.value).toBe("aa");
    expect(spy).toHaveBeenCalledTimes(1);

    a.value = "a!";

    expect(d.value).toBe("a!a!");
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test("deep nested memos", () => {
    const a = signal(2);
    const spyB = vi.fn(() => a.value + 1);
    const b = computed(spyB);
    const spyC = vi.fn(() => a.value + b.value);
    const c = computed(spyC);
    const spyD = vi.fn(() => a.value + b.value + c.value);
    const d = computed(spyD);
    expect(d.value).toBe(10);
    expect(spyB).toHaveBeenCalledTimes(1);
    expect(spyC).toHaveBeenCalledTimes(1);
    expect(spyD).toHaveBeenCalledTimes(1);
    a.value = 4;
    d.value;
    expect(spyB).toHaveBeenCalledTimes(2);
    expect(spyC).toHaveBeenCalledTimes(2);
    expect(spyD).toHaveBeenCalledTimes(2);
  });

  test("repeating computeds runs once", () => {
    const a = signal(1);
    const spyB = vi.fn(() => a.value + a.value);
    const b = computed(spyB);
    const spyC = vi.fn(() => a.value + b.value + a.value + b.value);
    const c = computed(spyC);
    const spyD = vi.fn(
      () => a.value + b.value + c.value + a.value + b.value + c.value
    );
    const d = computed(spyD);
    expect(d.value).toBe(18);
    expect(spyB).toHaveBeenCalledTimes(1);
    expect(spyC).toHaveBeenCalledTimes(1);
    expect(spyD).toHaveBeenCalledTimes(1);
    a.value = 4;
    d.value;
    expect(spyB).toHaveBeenCalledTimes(2);
    expect(spyC).toHaveBeenCalledTimes(2);
    expect(spyD).toHaveBeenCalledTimes(2);
  });

  test("chained memos", () => {
    const a = signal("a");
    const spyB = vi.fn(() => a.value);
    const b = computed(spyB);
    const c = computed(() => b.value);
    const d = computed(() => c.value);

    expect(a.value).toBe("a");
    expect(b.value).toBe("a");
    expect(c.value).toBe("a");
    expect(d.value).toBe("a");
    expect(b.value).toBe("a");
    expect(spyB).toHaveBeenCalledTimes(1);

    a.value = "a!";
    expect(a.value).toBe("a!");
    expect(b.value).toBe("a!");
    expect(c.value).toBe("a!");
    expect(d.value).toBe("a!");
    expect(b.value).toBe("a!");
    expect(spyB).toHaveBeenCalledTimes(2);
  });

  //   A
  //  / \
  // B   C
  //  \ /
  //   D
  //   |
  //   E
  //   |
  //   F
  test("diamond with tail (updates and runs once)", () => {
    const a = signal("a");
    const b = computed(() => a.value);
    const c = computed(() => a.value);
    const dSpy = vi.fn(() => b.value + c.value);
    const d = computed(dSpy);
    const e = computed(() => d.value);
    const f = computed(() => d.value);

    expect(e.value).toBe("aa");
    expect(f.value).toBe("aa");
    expect(dSpy).toBeCalledTimes(1);

    a.value = "b";
    expect(e.value).toBe("bb");
    expect(f.value).toBe("bb");
    expect(dSpy).toBeCalledTimes(2);
  });

  // A   B  C   D
  //  \ /    \ /
  //   E      F
  //    \    /
  //      G
  test("tree (updates and runs once)", () => {
    const a = signal("a");
    const b = signal("b");
    const c = signal("c");
    const d = signal("d");
    const e = computed(() => a.value + b.value);
    const f = computed(() => c.value + d.value);
    const gSpy = vi.fn(() => e.value + f.value);
    const g = computed(gSpy);
    expect(e.value).toBe("ab");
    expect(f.value).toBe("cd");
    expect(gSpy).toBeCalledTimes(0);
    expect(g.value).toBe("abcd");
    expect(gSpy).toBeCalledTimes(1);
    d.value = "d!";
    c.value = "c!";
    b.value = "b!";
    a.value = "a!";
    expect(e.value).toBe("a!b!");
    expect(f.value).toBe("c!d!");
    expect(gSpy).toBeCalledTimes(1);
    expect(g.value).toBe("a!b!c!d!");
    expect(gSpy).toBeCalledTimes(2);
  });
});

describe("effects", () => {
  test("effects", () => {
    const a = signal(1);
    const b = signal(2);
    const cSpy = vi.fn(() => a.value + b.value);
    const c = effect(cSpy);
    expect(cSpy).toHaveBeenCalledTimes(0);
    a.value = 10;
    flushSync();
    expect(cSpy).toHaveBeenCalledTimes(1);
    b.value = 20;
    flushSync();
    expect(cSpy).toHaveBeenCalledTimes(2);
  });

  test("unsubscribe invisible dependencies (memos)", () => {
    const a = signal(true);
    const b = signal("b");
    const c = signal("c");
    const fSpy = vi.fn(() => (a.value ? b.value : c.value));
    const f = computed(fSpy);
    expect(fSpy).toHaveBeenCalledTimes(0);
    expect(f.value).toBe("b");
    expect(fSpy).toHaveBeenCalledTimes(1);
    a.value = false;
    expect(f.value).toBe("c");
    expect(fSpy).toHaveBeenCalledTimes(2);
    a.value = true;
    expect(f.value).toBe("b");
    expect(fSpy).toHaveBeenCalledTimes(3);
    c.value = "c!";
    c.value = "c!!";
    flushSync();
    expect(f.value).toBe("b");
    expect(fSpy).toHaveBeenCalledTimes(3);
    a.value = false;
    expect(f.value).toBe("c!!");
    expect(fSpy).toHaveBeenCalledTimes(4);
    b.value = "b!";
    b.value = "b!!";
    flushSync();
    expect(fSpy).toHaveBeenCalledTimes(4);
    a.value = false;
    expect(fSpy).toHaveBeenCalledTimes(4);
    b.value = "b!!!";
    expect(fSpy).toHaveBeenCalledTimes(4);
  });

  test("dispose effects", () => {
    const a = signal("a");
    const bSpy = vi.fn(() => a.value);
    const b = effect(bSpy);
    expect(bSpy).toHaveBeenCalledTimes(0);

    // read effect
    flushSync();
    expect(bSpy).toHaveBeenCalledTimes(1);

    // set a
    a.value = "a!";
    expect(bSpy).toHaveBeenCalledTimes(1);

    // dispose effect
    b();
    expect(bSpy).toHaveBeenCalledTimes(1);
    a.value = "a!!";
    expect(bSpy).toHaveBeenCalledTimes(1);
    a.value = "a!!!";
    expect(bSpy).toHaveBeenCalledTimes(1);
    flushSync();
  });

  test("effect with conditions", () => {
    const s1 = signal(true);
    const s2 = signal("a");
    const s3 = signal("b");
    const s4 = computed(() => s2.value);
    const s5 = computed(() => s3.value);
    let result = { value: 0 };
    effect(() => {
      if (s1.value) {
        s4.value;
        result.value = 1;
      } else {
        s5.value;
        result.value = 0;
      }
    });
    s1.value = false;
    flushSync();
    expect(result.value).toBe(0);
    s1.value = true;
    flushSync();
    expect(result.value).toBe(1);
  });

  test("effect with nested dependencies", () => {
    const a = signal(2);
    const spyB = vi.fn(() => a.value + 1);
    const b = computed(spyB);
    const spyC = vi.fn(() => b.value);
    const c = computed(spyC);
    const spyD = vi.fn(() => c.value);
    const d = computed(spyD);
    const spyE = vi.fn(() => d.value);
    effect(spyE);
    flushSync();
    expect(spyE).toHaveBeenCalledTimes(1);
    a.value = 4;
    flushSync();
    expect(spyE).toHaveBeenCalledTimes(2);
  });

  test("cleanup effect", () => {
    const spy = vi.fn();
    const x = signal(1);
    effect(() => {
      x.value;
      return () => spy();
    });
    flushSync();
    expect(spy).toHaveBeenCalledTimes(0);
    x.value++;
    flushSync();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("can nest effects", () => {
    const eff1 = vi.fn();
    const eff2 = vi.fn();
    const a = signal(1);

    effect(() => {
      eff1();
      a.value;
      const inner = effect(() => {
        a.value;
        eff2();
      });
      return () => inner();
    });

    expect(eff1).toHaveBeenCalledTimes(0);
    expect(eff2).toHaveBeenCalledTimes(0);

    a.value++;
    flushSync();
    expect(eff1).toHaveBeenCalledTimes(1);
    expect(eff2).toHaveBeenCalledTimes(1);

    a.value++;
    flushSync();
    expect(eff1).toHaveBeenCalledTimes(2);
    expect(eff2).toHaveBeenCalledTimes(2);
  });
});
