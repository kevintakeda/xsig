import { expect, test, vi, describe } from "vitest";
import { flushEffects, signal } from "../src";

describe("state", () => {
  test("store and return a value", () => {
    const a = signal(1);
    expect(a.val).toBe(1);
  });

  test("updates its value", () => {
    const a = signal(1);
    a.val = 2;
    expect(a.val).toBe(2);
  });

  test("multi updates", () => {
    const a = signal(1);
    a.val = 1;
    a.val = 2;
    a.val = 3;
    expect(a.val).toBe(3);
  });
});

describe("memos", () => {
  test("caching", () => {
    const a = signal(1);
    const b = signal(2);
    const cSpy = vi.fn(() => a.val + b.val);
    const c = signal(cSpy);
    expect(c.val).toBe(3);
    expect(c.val).toBe(3);
    expect(c.val).toBe(3);
    expect(cSpy).toHaveBeenCalledTimes(1);
  });

  test("laziness", () => {
    const a = signal(1);
    const b = signal(2);
    const cSpy = vi.fn(() => a.val + b.val);
    const c = signal(cSpy);
    // test lazyness
    a.val = 12;
    a.val = 10;
    b.val = 8;
    b.val = 6;
    expect(cSpy).toHaveBeenCalledTimes(0);
    expect(c.val).toBe(16);
    expect(cSpy).toHaveBeenCalledTimes(1);
  });

  test("with simple condition", () => {
    const a = signal(false);
    const bSpy = vi.fn(() => (a.val ? "1" : "2"));
    const b = signal(bSpy);
    expect(b.val).toBe("2");
    a.val = true;
    expect(b.val).toBe("1");
    a.val = false;
    expect(b.val).toBe("2");
    a.val = true;
    expect(b.val).toBe("1");
    expect(bSpy).toHaveBeenCalledTimes(4);
  });

  test("unsubscribe invisible dependencies", () => {
    const a = signal(false);
    const b = signal("b");
    const c = signal("c");

    const dSpy = vi.fn(() => (a.val ? b.val : c.val));
    const d = signal(dSpy);
    expect(d.val).toBe("c");

    a.val = true;
    a.val = false;
    expect(d.val).toBe("c");
    expect(dSpy).toHaveBeenCalledTimes(2);
    b.val = "b!";
    b.val = "b!!";
    expect(d.val).toBe("c");
    expect(dSpy).toHaveBeenCalledTimes(2);

    a.val = true;
    expect(d.val).toBe("b!!");
    expect(dSpy).toHaveBeenCalledTimes(3);

    c.val = "c!";
    c.val = "c!!";
    expect(d.val).toBe("b!!");
    expect(dSpy).toHaveBeenCalledTimes(3);

    a.val = false;
    expect(d.val).toBe("c!!");
    expect(dSpy).toHaveBeenCalledTimes(4);
  });
});

describe("graph", () => {
  test("the diamond problem", () => {
    const a = signal("a");
    const b = signal(() => a.val);
    const c = signal(() => a.val);

    const spy = vi.fn(() => b.val + c.val);
    const d = signal(spy);

    expect(d.val).toBe("aa");
    expect(spy).toHaveBeenCalledTimes(1);

    a.val = "a!";

    expect(d.val).toBe("a!a!");
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test("deep nested memos", () => {
    const a = signal(2);
    const spyB = vi.fn(() => a.val + 1);
    const b = signal(spyB);
    const spyC = vi.fn(() => a.val + b.val);
    const c = signal(spyC);
    const spyD = vi.fn(() => a.val + b.val + c.val);
    const d = signal(spyD);
    expect(d.val).toBe(10);
    expect(spyB).toHaveBeenCalledTimes(1);
    expect(spyC).toHaveBeenCalledTimes(1);
    expect(spyD).toHaveBeenCalledTimes(1);
    a.val = 4;
    d.val;
    expect(spyB).toHaveBeenCalledTimes(2);
    expect(spyC).toHaveBeenCalledTimes(2);
    expect(spyD).toHaveBeenCalledTimes(2);
  });

  test("run once if inner memos don't change", () => {
    const a = signal("a");
    const b = signal(() => {
      a.val;
      return "b";
    });

    const spyC = vi.fn(() => b.val);
    const c = signal(spyC);

    expect(c.val).toBe("b");
    expect(spyC).toHaveBeenCalledTimes(1);

    a.val = "a!";

    expect(c.val).toBe("b");
    expect(spyC).toHaveBeenCalledTimes(1);
  });

  test("run once if inner memos don't change (DEEP)", () => {
    const a = signal("a");
    const b = signal(() => {
      a.val;
      return "b";
    });

    const spyC = vi.fn(() => b.val);
    const c = signal(spyC);

    const spyD = vi.fn(() => c.val);
    const d = signal(spyD);

    expect(d.val).toBe("b");
    expect(spyC).toHaveBeenCalledTimes(1);
    expect(spyD).toHaveBeenCalledTimes(1);

    a.val = "a!";
    expect(d.val).toBe("b");
    expect(spyC).toHaveBeenCalledTimes(1);
    expect(spyD).toHaveBeenCalledTimes(1);

    a.val = "a!!";
    expect(d.val).toBe("b");
    expect(spyC).toHaveBeenCalledTimes(1);
    expect(spyD).toHaveBeenCalledTimes(1);
  });

  test("chained memos", () => {
    const a = signal("a");
    const spyB = vi.fn(() => a.val);
    const b = signal(spyB);
    const c = signal(() => b.val);
    const d = signal(() => c.val);

    expect(a.val).toBe("a");
    expect(b.val).toBe("a");
    expect(c.val).toBe("a");
    expect(d.val).toBe("a");
    expect(b.val).toBe("a");
    expect(spyB).toHaveBeenCalledTimes(1);

    a.val = "a!";
    expect(a.val).toBe("a!");
    expect(b.val).toBe("a!");
    expect(c.val).toBe("a!");
    expect(d.val).toBe("a!");
    expect(b.val).toBe("a!");
    expect(spyB).toHaveBeenCalledTimes(2);
  });

  test("multi-branch linked by memo", () => {
    const a = signal("a");
    const b = signal(() => a.val);
    const c = signal(() => a.val);
    const dSpy = vi.fn(() => b.val + c.val);
    const d = signal(dSpy);
    const e = signal(() => d.val);
    const f = signal(() => d.val);

    expect(e.val).toBe("aa");
    expect(f.val).toBe("aa");
    expect(dSpy).toBeCalledTimes(1);

    a.val = "b";
    expect(e.val).toBe("bb");
    expect(f.val).toBe("bb");
    expect(dSpy).toBeCalledTimes(2);
  });

  test("tree", () => {
    const a = signal("a");
    const b = signal("b");
    const c = signal("c");
    const d = signal("d");
    const e = signal(() => a.val + b.val);
    const f = signal(() => c.val + d.val);
    const gSpy = vi.fn(() => e.val + f.val);
    const g = signal(gSpy);
    expect(e.val).toBe("ab");
    expect(f.val).toBe("cd");
    expect(gSpy).toBeCalledTimes(0);
    expect(g.val).toBe("abcd");
    expect(gSpy).toBeCalledTimes(1);
    d.val = "d!";
    c.val = "c!";
    b.val = "b!";
    a.val = "a!";
    expect(e.val).toBe("a!b!");
    expect(f.val).toBe("c!d!");
    expect(gSpy).toBeCalledTimes(1);
    expect(g.val).toBe("a!b!c!d!");
    expect(gSpy).toBeCalledTimes(2);
  });
});

describe("effects", () => {
  test("effects", () => {
    const a = signal(1);
    const b = signal(2);
    const cSpy = vi.fn(() => a.val + b.val);
    const c = signal(cSpy, { effect: true });
    expect(cSpy).toHaveBeenCalledTimes(0);
    expect(c.val).toBe(3);
    expect(c.val).toBe(3);
    expect(cSpy).toHaveBeenCalledTimes(1);
    a.val = 10;
    expect(cSpy).toHaveBeenCalledTimes(1);
    expect(c.val).toBe(12);
    expect(cSpy).toHaveBeenCalledTimes(2);
    b.val = 20;
    expect(cSpy).toHaveBeenCalledTimes(2);
    expect(c.val).toBe(30);
    expect(cSpy).toHaveBeenCalledTimes(3);
  });

  test("unsubscribe invisible dependencies", () => {
    const a = signal(true);
    const b = signal("b");
    const c = signal("c");
    const fSpy = vi.fn(() => (a.val ? b.val : c.val));
    const f = signal(fSpy, { effect: true });
    expect(fSpy).toHaveBeenCalledTimes(0);
    expect(f.val).toBe("b");
    expect(fSpy).toHaveBeenCalledTimes(1);
    a.val = false;
    expect(f.val).toBe("c");
    expect(fSpy).toHaveBeenCalledTimes(2);
    a.val = true;
    expect(f.val).toBe("b");
    expect(fSpy).toHaveBeenCalledTimes(3);
    c.val = "c!";
    c.val = "c!!";
    flushEffects();
    expect(f.val).toBe("b");
    expect(fSpy).toHaveBeenCalledTimes(3);
    a.val = false;
    expect(f.val).toBe("c!!");
    expect(fSpy).toHaveBeenCalledTimes(4);
    b.val = "b!";
    b.val = "b!!";
    flushEffects();
    expect(fSpy).toHaveBeenCalledTimes(4);
    a.val = false;
    expect(fSpy).toHaveBeenCalledTimes(4);
    b.val = "b!!!";
    expect(fSpy).toHaveBeenCalledTimes(4);
  });

  test("unsubscribe invisible dependencies (effects)", () => {
    const a = signal(true);
    const b = signal("b");
    const c = signal("c");
    const d = signal(() => b.val, { effect: true });
    const e = signal(() => c.val, { effect: true });
    const fSpy = vi.fn(() => (a.val ? d.val : e.val));
    const f = signal(fSpy, { effect: true });

    expect(f.val).toBe("b");
    expect(fSpy).toHaveBeenCalledTimes(1);
    a.val = false;
    expect(f.val).toBe("c");
    expect(fSpy).toHaveBeenCalledTimes(2);
    a.val = true;
    expect(f.val).toBe("b");
    c.val = "c!";
    c.val = "c!!";
    expect(fSpy).toHaveBeenCalledTimes(3);
    a.val = false;
    expect(f.val).toBe("c!!");
    b.val = "b!";
    b.val = "b!!";
    expect(fSpy).toHaveBeenCalledTimes(4);
    a.val = false;
    expect(fSpy).toHaveBeenCalledTimes(4);
    b.val = "b!!!";
    expect(fSpy).toHaveBeenCalledTimes(4);
  });

  test("nested effects run once", () => {
    const a = signal(2);
    const spyB = vi.fn(() => a.val);
    const b = signal(spyB, { effect: true });
    const spyC = vi.fn(() => a.val);
    const c = signal(spyC, { effect: true });
    const spyD = vi.fn(() => a.val);
    const d = signal(spyD, { effect: true });

    // read a
    expect(a.val).toBe(2);
    expect(spyB).toHaveBeenCalledTimes(0);
    expect(spyC).toHaveBeenCalledTimes(0);
    expect(spyD).toHaveBeenCalledTimes(0);

    // read effect
    expect(d.val).toBe(2);
    expect(spyD).toHaveBeenCalledTimes(1);

    // set twice
    a.val = 4;
    a.val = 4;
    expect(spyB).toHaveBeenCalledTimes(0);
    expect(spyC).toHaveBeenCalledTimes(0);
    expect(spyD).toHaveBeenCalledTimes(1);

    // read all values
    expect(a.val).toBe(4);
    expect(b.val).toBe(4);
    expect(c.val).toBe(4);
    expect(d.val).toBe(4);
    expect(spyB).toHaveBeenCalledTimes(1);
    expect(spyC).toHaveBeenCalledTimes(1);
    expect(spyD).toHaveBeenCalledTimes(2);
    flushEffects();
  });

  test("dispose effects", () => {
    const a = signal("a");
    const bSpy = vi.fn(() => a.val);
    const b = signal(bSpy, { effect: true });
    expect(bSpy).toHaveBeenCalledTimes(0);

    // read effect
    expect(b.val).toBe("a");
    expect(bSpy).toHaveBeenCalledTimes(1);

    // set a
    a.val = "a!";
    expect(bSpy).toHaveBeenCalledTimes(1);

    // dispose effect
    b.val = null;
    expect(b.val).toBe(null);
    expect(bSpy).toHaveBeenCalledTimes(1);
    a.val = "a!!";
    expect(bSpy).toHaveBeenCalledTimes(1);
    a.val = "a!!!";
    expect(bSpy).toHaveBeenCalledTimes(1);
    flushEffects();
  });

  test("effect with conditions", () => {
    const s1 = signal(true);
    const s2 = signal("a");
    const s3 = signal("b");
    const s4 = signal(() => s2.val);
    const s5 = signal(() => s3.val);
    let result = { val: 0 };
    signal(
      () => {
        if (s1.val) {
          s4.val;
          result.val = 1;
        } else {
          s5.val;
          result.val = 0;
        }
      },
      { effect: true }
    );
    s1.val = false;
    flushEffects();
    expect(result.val).toBe(0);
    s1.val = true;
    flushEffects();
    expect(result.val).toBe(1);
  });

  test("effect with nested dependencies", () => {
    const a = signal(2);
    const spyB = vi.fn(() => a.val + 1);
    const b = signal(spyB);
    const spyC = vi.fn(() => b.val);
    const c = signal(spyC);
    const spyD = vi.fn(() => c.val);
    const d = signal(spyD);
    const spyE = vi.fn(() => d.val);
    signal(spyE, { effect: true });
    flushEffects();
    expect(spyE).toHaveBeenCalledTimes(1);
    a.val = 4;
    flushEffects();
    expect(spyE).toHaveBeenCalledTimes(2);
  });
});
