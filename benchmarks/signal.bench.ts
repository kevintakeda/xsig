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

describe("deep get", () => {
  function op(api: SignalApi) {
    api.root(() => {
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
      assert(s10.get(), "a");
    });
  }

  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("deep set+get", () => {
  function op(api: SignalApi) {
    api.root(() => {
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
      s1.set(s1.get() + 1);
      s10.get();
    });
  }

  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("wide get", () => {
  function op(api: SignalApi) {
    api.root(() => {
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
      s10.get();
    });
  }
  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("wide set+get", () => {
  function op(api: SignalApi) {
    api.root(() => {
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
      s5.set(s5.get() + 1);
      assert(s.get() === 10);
    });
  }
  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("simple effect", () => {
  function op(api: SignalApi) {
    let result = 0;
    api.root(() => {
      const s = api.signal(1);
      api.effect(() => {
        result = s.get();
      });
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
    });
    assert(result === 10);
  }
  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("tree effects", () => {
  function op(api: SignalApi) {
    api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      const s4 = api.signal(1);
      const s5 = api.computed(() => s1.get() + s2.get());
      const s6 = api.computed(() => s3.get() + s4.get());
      api.effect(() => {
        s5.get() + s6.get();
      });
      api.runSync(() => {
        s3.set(s3.get() + 1);
        s1.set(s1.get() + 1);
      });
    });
  }
  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("effect with conditions", () => {
  function op(api: SignalApi) {
    api.root(() => {
      const s1 = api.signal(true);
      const s2 = api.signal("a");
      const s3 = api.signal("b");
      const s4 = api.computed(() => s2.get());
      const s5 = api.computed(() => s3.get());
      api.effect(() => {
        s1.get() ? s4.get() : s5.get();
      });
      api.runSync(() => {
        s1.set(false);
        s1.set(true);
      });
    });
  }

  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("wide effects", () => {
  function op(api: SignalApi) {
    api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      const s4 = api.signal(1);
      const s5 = api.signal(1);
      const s6 = api.signal(1);
      const s7 = api.signal(1);
      const s8 = api.signal(1);
      const s9 = api.signal(1);
      api.runSync(() => {
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
        s1.set(s1.get() + 1);
        s5.set(s5.get() + 1);
        s9.set(s9.get() + 1);
      });
    });
  }
  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("1000 computations", () => {
  function op(api: SignalApi) {
    api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      const computations: Array<any> = [];
      api.runSync(() => {
        for (let i = 0; i < 1000; i++) {
          if (i % 2 === 0)
            computations.push(
              api.computed(() => s1.get() * s2.get() * s3.get())
            );
        }
      });
      api.runSync(() => {
        s3.set(Math.random());
        s2.set(Math.random());
        s1.set(Math.random());
      });
      computations.forEach((el) => el.get());
    });
  }
  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});

describe("1000 effects", () => {
  function op(api: SignalApi) {
    api.root(() => {
      const s1 = api.signal(1);
      const s2 = api.signal(1);
      const s3 = api.signal(1);
      api.runSync(() => {
        for (let i = 0; i < 1000; i++) {
          api.effect(() => s1.get() * s2.get() * s3.get());
        }
      });
      api.runSync(() => {
        s3.set(Math.random());
        s2.set(Math.random());
        s1.set(Math.random());
      });
    });
  }
  bench("nanosignals", () => {
    op(NanoSignals);
  });

  bench("solid-js", () => {
    op(SolidSignals);
  });

  bench("preact", () => {
    op(PreactSignals);
  });

  bench("reactively", () => {
    op(Reactively);
  });

  bench("@maverick-js/signals", () => {
    op(MaverickSignals);
  });

  bench("signal-polyfill", () => {
    op(SignalPolyfill);
  });
});
