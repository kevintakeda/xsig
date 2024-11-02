import { assert, bench, describe } from "vitest";
import {
  MaverickSignals,
  NanoSignals,
  PreactSignals,
  Reactively,
  SignalApi,
  SignalPolyfill,
  SolidSignals,
} from "./frameworks";

function runAll(op: (api: SignalApi) => (() => void)) {
  const x1 = op(NanoSignals);
  bench("nanosignals", () => {
    x1()
  });

  const x2 = op(SolidSignals);
  bench("solid-js", () => {
    x2()
  });

  const x3 = op(PreactSignals);
  bench("preact", () => {
    x3();
  });

  const x4 = op(Reactively);
  bench("reactively", () => {
    x4();
  });

  const x5 = op(MaverickSignals);
  bench("@maverick-js/signals", () => {
    x5();
  });

  const x6 = op(SignalPolyfill);
  bench("signal-polyfill", () => {
    x6();
  });
}

describe("simple set+get", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.computed(() => s1.get());
      return () => (s1.set(s1.get() + 1), s2.get());
    });
  }
  runAll(op);
});

describe("deep get", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s = api.signal("a");
      const s2 = api.computed(() => s.get());
      const s3 = api.computed(() => s2.get());
      const s4 = api.computed(() => s3.get());
      const s5 = api.computed(() => s4.get());
      const s6 = api.computed(() => s5.get());
      const s7 = api.computed(() => s6.get());
      const s8 = api.computed(() => s7.get());
      const s9 = api.computed(() => s8.get());
      const s10 = api.computed(() => s9.get());
      return () => {
        assert(s10.get(), "a");
      }
    });
  }
  runAll(op);
});

describe("deep set+get", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.computed(() => s1.get());
      const s3 = api.computed(() => s2.get());
      const s4 = api.computed(() => s3.get());
      const s5 = api.computed(() => s4.get());
      const s6 = api.computed(() => s5.get());
      const s7 = api.computed(() => s6.get());
      const s8 = api.computed(() => s7.get());
      const s9 = api.computed(() => s8.get());
      const s10 = api.computed(() => s9.get());
      return () => {
        s1.set(s1.get() + 1);
        s10.get();
      }
    });
  }
  runAll(op);
});

describe("wide get", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      const s4 = api.signal(1);
      const s5 = api.signal(1);
      const s6 = api.signal(1);
      const s7 = api.signal(1);
      const s8 = api.signal(1);
      const s9 = api.signal(1);
      const s10 = api.computed(
        () =>
          s1.get() +
          s2.get() +
          s3.get() +
          s4.get() +
          s5.get() +
          s6.get() +
          s7.get() +
          s8.get() +
          s9.get()
      );

      return () => {
        s10.get();
      }
    });
  }
  runAll(op);
});

describe("wide set+get", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      const s4 = api.signal(1);
      const s5 = api.signal(1);
      const s6 = api.signal(1);
      const s7 = api.signal(1);
      const s8 = api.signal(1);
      const s9 = api.signal(1);
      const s = api.computed(
        () =>
          s1.get() +
          s2.get() +
          s3.get() +
          s4.get() +
          s5.get() +
          s6.get() +
          s7.get() +
          s8.get() +
          s9.get()
      );
      return () => {
        s5.set(s.get() + 1);
      }
    });
  }
  runAll(op);
});

describe("simple effect", () => {
  function op(api: SignalApi) {
    let result = 0;
    return api.root(() => {
      const s = api.signal(1);
      api.effect(() => {
        result = s.get();
      });
      return () => {
        api.runSync(() => {
          s.set(s.get() + 1);
          s.set(s.get() + 1);
          s.set(s.get() + 1);
          s.set(s.get() + 1);
          s.set(s.get() + 1);
          s.set(s.get() + 1);
          s.set(s.get() + 1);
          s.set(s.get() + 1);
          s.set(s.get() + 1);
        });
      }
    });
  }
  runAll(op);
});

describe("tree effects", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      const s4 = api.signal(1);
      const s5 = api.computed(() => s1.get() + s2.get());
      const s6 = api.computed(() => s3.get() + s4.get());
      api.effect(() => {
        s5.get() + s6.get();
      });
      return () => {
        api.runSync(() => {
          s3.set(s3.get() + 1);
          s1.set(s1.get() + 1);
        });
      }
    });
  }
  runAll(op);
});

describe("effect with conditions", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(true);
      const s2 = api.signal("a");
      const s3 = api.signal("b");
      const s4 = api.computed(() => s2.get());
      const s5 = api.computed(() => s3.get());
      api.effect(() => {
        s1.get() ? s4.get() : s5.get();
      });
      return () => {
        api.runSync(() => {
          s1.set(false);
          s1.set(true);
        });
      }
    });
  }
  runAll(op);
});

describe("wide effects", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      const s4 = api.signal(1);
      const s5 = api.signal(1);
      const s6 = api.signal(1);
      const s7 = api.signal(1);
      const s8 = api.signal(1);
      const s9 = api.signal(1);
      api.effect(() => {
        s1.get() +
          s2.get() +
          s3.get() +
          s4.get() +
          s5.get() +
          s6.get() +
          s7.get() +
          s8.get() +
          s9.get() +
          s1.get() +
          s2.get() +
          s3.get() +
          s4.get() +
          s5.get() +
          s6.get() +
          s7.get() +
          s8.get() +
          s9.get();
      });
      return () => {
        api.runSync(() => {
          s1.set(s1.get() + 1);
          s5.set(s5.get() + 1);
          s9.set(s9.get() + 1);
        });
      }
    });
  }
  runAll(op);
});

describe("1000 computations", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      const bucket1: any[] = [];
      const bucket2: any[] = [];
      const bucket3: any[] = [];
      api.runSync(() => {
        for (let i = 0; i < 1000; i++) {
          if (i % 3 === 1) {
            bucket1.push(api.computed(() => s1.get()));
          } else if (i % 3 === 2) {
            bucket2.push(api.computed(() => s2.get()));
          } else {
            bucket3.push(api.computed(() => s1.get() + s2.get() + s3.get()));
          }
        }
      });
      bucket1.forEach(el => el.get())
      bucket2.forEach(el => el.get())
      bucket3.forEach(el => el.get())
      return () => {
        api.runSync(() => {
          s2.set(s2.get() + 1);
          bucket2.forEach(el => el.get())
        });
      }
    });
  }
  runAll(op);
});

describe("1000 effects", () => {
  function op(api: SignalApi) {
    return api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      api.runSync(() => {
        for (let i = 0; i < 1000; i++) {
          if (i % 3 === 1) {
            api.effect(() => s1.get());
          } else if (i % 3 === 2) {
            api.effect(() => s2.get());
          } else {
            api.effect(() => s1.get() + s2.get() + s3.get());
          }
        }
      });
      let j = 0
      return () => {
        api.runSync(() => {
          if (j % 2 === 0) {
            s1.set(Math.random());
          } else {
            s2.set(Math.random());
          }
        });
      }
    });
  }
  runAll(op);
});
