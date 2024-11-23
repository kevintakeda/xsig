import { expect, test, vi, describe } from "vitest";
import { Sig, tick } from "../src";

describe("state", () => {
  test("store and return a value", () => {
    const a = new Sig(1);
    expect(a.val).toBe(1);
  });

  test("updates its value", () => {
    const a = new Sig(1);
    a.val = 2;
    expect(a.val).toBe(2);
  });

  test("multi updates", () => {
    const a = new Sig(1);
    a.val = 1;
    a.val = 2;
    a.val = 3;
    expect(a.val).toBe(3);
  });
});

describe("memos", () => {
  test("caching", () => {
    const a = new Sig(1);
    const b = new Sig(2);
    const cSpy = vi.fn(() => a.val + b.val);
    const c = new Sig(cSpy);
    expect(c.val).toBe(3);
    expect(c.val).toBe(3);
    expect(c.val).toBe(3);
    expect(cSpy).toHaveBeenCalledTimes(1);
  });

  test("laziness", () => {
    const a = new Sig(1);
    const b = new Sig(2);
    const cSpy = vi.fn(() => a.val + b.val);
    const c = new Sig(cSpy);
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
    const a = new Sig(false);
    const bSpy = vi.fn(() => (a.val ? "1" : "2"));
    const b = new Sig(bSpy);
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
    const a = new Sig(false);
    const b = new Sig("b");
    const c = new Sig("c");

    const dSpy = vi.fn(() => (a.val ? b.val : c.val));
    const d = new Sig(dSpy);
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
    const a = new Sig("a");
    const b = new Sig(() => a.val);
    const c = new Sig(() => a.val);

    const spy = vi.fn(() => b.val + c.val);
    const d = new Sig(spy);

    expect(d.val).toBe("aa");
    expect(spy).toHaveBeenCalledTimes(1);

    a.val = "a!";

    expect(d.val).toBe("a!a!");
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test("deep nested memos", () => {
    const a = new Sig(2);
    const spyB = vi.fn(() => a.val + 1);
    const b = new Sig(spyB);
    const spyC = vi.fn(() => a.val + b.val);
    const c = new Sig(spyC);
    const spyD = vi.fn(() => a.val + b.val + c.val);
    const d = new Sig(spyD);
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

  test("chained memos", () => {
    const a = new Sig("a");
    const spyB = vi.fn(() => a.val);
    const b = new Sig(spyB);
    const c = new Sig(() => b.val);
    const d = new Sig(() => c.val);

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
    const a = new Sig("a");
    const b = new Sig(() => a.val);
    const c = new Sig(() => a.val);
    const dSpy = vi.fn(() => b.val + c.val);
    const d = new Sig(dSpy);
    const e = new Sig(() => d.val);
    const f = new Sig(() => d.val);

    expect(e.val).toBe("aa");
    expect(f.val).toBe("aa");
    expect(dSpy).toBeCalledTimes(1);

    a.val = "b";
    expect(e.val).toBe("bb");
    expect(f.val).toBe("bb");
    expect(dSpy).toBeCalledTimes(2);
  });

  test("tree", () => {
    const a = new Sig("a");
    const b = new Sig("b");
    const c = new Sig("c");
    const d = new Sig("d");
    const e = new Sig(() => a.val + b.val);
    const f = new Sig(() => c.val + d.val);
    const gSpy = vi.fn(() => e.val + f.val);
    const g = new Sig(gSpy);
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
    const a = new Sig(1);
    const b = new Sig(2);
    const cSpy = vi.fn(() => a.val + b.val);
    const c = new Sig(cSpy, true);
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
    const a = new Sig(true);
    const b = new Sig("b");
    const c = new Sig("c");
    const fSpy = vi.fn(() => (a.val ? b.val : c.val));
    const f = new Sig(fSpy);
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
    tick();
    expect(f.val).toBe("b");
    expect(fSpy).toHaveBeenCalledTimes(3);
    a.val = false;
    expect(f.val).toBe("c!!");
    expect(fSpy).toHaveBeenCalledTimes(4);
    b.val = "b!";
    b.val = "b!!";
    tick();
    expect(fSpy).toHaveBeenCalledTimes(4);
    a.val = false;
    expect(fSpy).toHaveBeenCalledTimes(4);
    b.val = "b!!!";
    expect(fSpy).toHaveBeenCalledTimes(4);
  });

  test("unsubscribe invisible dependencies (effects)", () => {
    const a = new Sig(true);
    const b = new Sig("b");
    const c = new Sig("c");
    const d = new Sig(() => b.val, true);
    const e = new Sig(() => c.val, true);
    const fSpy = vi.fn(() => (a.val ? d.val : e.val));
    const f = new Sig(fSpy, true);

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
    const a = new Sig(2);
    const spyB = vi.fn(() => a.val);
    const b = new Sig(spyB, true);
    const spyC = vi.fn(() => a.val);
    const c = new Sig(spyC, true);
    const spyD = vi.fn(() => a.val);
    const d = new Sig(spyD, true);

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
    tick();
  });

  test("dispose effects", () => {
    const a = new Sig("a");
    const bSpy = vi.fn(() => a.val);
    const b = new Sig(bSpy, true);
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
    tick();

    // can still be used as a data source
    const xSpy = vi.fn();
    const x = new Sig(() => {
      xSpy();
      return b.val
    });
    b.val = "!"
    expect(x.val).toBe("!")
    expect(xSpy).toHaveBeenCalledTimes(1);
  });

  test("effect with conditions", () => {
    const s1 = new Sig(true);
    const s2 = new Sig("a");
    const s3 = new Sig("b");
    const s4 = new Sig(() => s2.val);
    const s5 = new Sig(() => s3.val);
    let result = { val: 0 };
    new Sig(
      () => {
        if (s1.val) {
          s4.val;
          result.val = 1;
        } else {
          s5.val;
          result.val = 0;
        }
      },
      true
    );
    s1.val = false;
    tick();
    expect(result.val).toBe(0);
    s1.val = true;
    tick();
    expect(result.val).toBe(1);
  });

  test("effect with nested dependencies", () => {
    const a = new Sig(2);
    const spyB = vi.fn(() => a.val + 1);
    const b = new Sig(spyB);
    const spyC = vi.fn(() => b.val);
    const c = new Sig(spyC);
    const spyD = vi.fn(() => c.val);
    const d = new Sig(spyD);
    const spyE = vi.fn(() => d.val);
    new Sig(spyE, true);
    tick();
    expect(spyE).toHaveBeenCalledTimes(1);
    a.val = 4;
    tick();
    expect(spyE).toHaveBeenCalledTimes(2);
  });

  test("cleanup effect", () => {
    const spy = vi.fn();
    const x = new Sig(1);
    new Sig(() => {
      x.val
      return () => spy();
    }, true);
    tick();
    expect(spy).toHaveBeenCalledTimes(0);
    x.val++;
    tick();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
