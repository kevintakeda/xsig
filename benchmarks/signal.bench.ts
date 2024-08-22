import { assert, bench, describe } from 'vitest'
import { signal as sig } from '../src';
import { createEffect, createMemo, createRoot, createSignal } from "solid-js/dist/solid.cjs"
import { signal, computed, effect } from "@preact/signals-core";
import { reactive, stabilize } from "@reactively/core";

describe('deep get', () => {
  bench('nanosignals', () => {
    const s = sig("a");
    const s2 = sig(() => s.val);
    const s3 = sig(() => s2.val);
    const s4 = sig(() => s3.val);
    const s5 = sig(() => s4.val);
    const s6 = sig(() => s5.val);
    const s7 = sig(() => s6.val);
    const s8 = sig(() => s7.val);
    const s9 = sig(() => s8.val);
    const s10 = sig(() => s9.val);
    assert(s10.val, "a");
  })

  bench('solid-js', () => {
    createRoot(() => {
      const [s] = createSignal("a");
      const s2 = createMemo(() => s());
      const s3 = createMemo(() => s2());
      const s4 = createMemo(() => s3());
      const s5 = createMemo(() => s4());
      const s6 = createMemo(() => s5());
      const s7 = createMemo(() => s6());
      const s8 = createMemo(() => s7());
      const s9 = createMemo(() => s8());
      const s10 = createMemo(() => s9());
      assert(s10(), "a");
    })
  })


  bench('preact', () => {
    const s = signal("a");
    const s2 = computed(() => s.value);
    const s3 = computed(() => s2.value);
    const s4 = computed(() => s3.value);
    const s5 = computed(() => s4.value);
    const s6 = computed(() => s5.value);
    const s7 = computed(() => s6.value);
    const s8 = computed(() => s7.value);
    const s9 = computed(() => s8.value);
    const s10 = computed(() => s9.value);
    assert(s10.value, "a");
  })

  bench('reactively', () => {
    const s = reactive("a");
    const s2 = reactive(() => s.get());
    const s3 = reactive(() => s2.get());
    const s4 = reactive(() => s3.get());
    const s5 = reactive(() => s4.get());
    const s6 = reactive(() => s5.get());
    const s7 = reactive(() => s6.get());
    const s8 = reactive(() => s7.get());
    const s9 = reactive(() => s8.get());
    const s10 = reactive(() => s9.get());
    assert(s10.get(), "a");
  })
})


describe('deep set+get', () => {
  bench('nanosignals', () => {
    const s1 = sig(1);
    const s2 = sig(() => s1.val);
    const s3 = sig(() => s2.val);
    const s4 = sig(() => s3.val);
    const s5 = sig(() => s4.val);
    const s6 = sig(() => s5.val);
    const s7 = sig(() => s6.val);
    const s8 = sig(() => s7.val);
    const s9 = sig(() => s8.val);
    const s10 = sig(() => s9.val);
    s1.val = (s1.val + 1)
    s10.val;
  })

  bench('solid-js', () => {
    createRoot(() => {
      const [s1, setS1] = createSignal(1);
      const s2 = createMemo(() => s1());
      const s3 = createMemo(() => s2());
      const s4 = createMemo(() => s3());
      const s5 = createMemo(() => s4());
      const s6 = createMemo(() => s5());
      const s7 = createMemo(() => s6());
      const s8 = createMemo(() => s7());
      const s9 = createMemo(() => s8());
      const s10 = createMemo(() => s9());
      setS1(s1() + 1);
      s10();
    })
  })


  bench('preact', () => {
    const s1 = signal(1);
    const s2 = computed(() => s1.value);
    const s3 = computed(() => s2.value);
    const s4 = computed(() => s3.value);
    const s5 = computed(() => s4.value);
    const s6 = computed(() => s5.value);
    const s7 = computed(() => s6.value);
    const s8 = computed(() => s7.value);
    const s9 = computed(() => s8.value);
    const s10 = computed(() => s9.value);
    s1.value = (s1.value + 1)
    s10.value;
  })

  bench('reactively', () => {
    const s1 = reactive(1);
    const s2 = reactive(() => s1.value);
    const s3 = reactive(() => s2.value);
    const s4 = reactive(() => s3.value);
    const s5 = reactive(() => s4.value);
    const s6 = reactive(() => s5.value);
    const s7 = reactive(() => s6.value);
    const s8 = reactive(() => s7.value);
    const s9 = reactive(() => s8.value);
    const s10 = reactive(() => s9.value);
    s1.value = (s1.get() + 1)
    s10.get();
  })
})

describe('wide get', () => {
  bench('nanosignals', () => {
    const s1 = sig(1);
    const s2 = sig(1);
    const s3 = sig(1);
    const s4 = sig(1);
    const s5 = sig(1);
    const s6 = sig(1);
    const s7 = sig(1);
    const s8 = sig(1);
    const s9 = sig(1);
    const s10 = sig(() => s1.val + s2.val + s3.val + s4.val + s5.val + s6.val + s7.val + s8.val + s9.val);
    s10.val
  })

  bench('solid-js', () => {
    createRoot(() => {
      const [s1] = createSignal(1);
      const [s2] = createSignal(1);
      const [s3] = createSignal(1);
      const [s4] = createSignal(1);
      const [s5] = createSignal(1);
      const [s6] = createSignal(1);
      const [s7] = createSignal(1);
      const [s8] = createSignal(1);
      const [s9] = createSignal(1);
      const s10 = createMemo(() => s1() + s2() + s3() + s4() + s5() + s6() + s7() + s8() + s9());
      s10();
    })
  })

  bench('preact', () => {
    const s1 = signal(1);
    const s2 = signal(1);
    const s3 = signal(1);
    const s4 = signal(1);
    const s5 = signal(1);
    const s6 = signal(1);
    const s7 = signal(1);
    const s8 = signal(1);
    const s9 = signal(1);
    const s10 = computed(() => s1.value + s2.value + s3.value + s4.value + s5.value + s6.value + s7.value + s8.value + s9.value);
    s10.value
  })

  bench('reactively', () => {
    const s1 = reactive(1);
    const s2 = reactive(1);
    const s3 = reactive(1);
    const s4 = reactive(1);
    const s5 = reactive(1);
    const s6 = reactive(1);
    const s7 = reactive(1);
    const s8 = reactive(1);
    const s9 = reactive(1);
    const s10 = reactive(() => s1.get() + s2.get() + s3.get() + s4.get() + s5.get() + s6.get() + s7.get() + s8.get() + s9.get());
    s10.get()
  })
})


describe('wide set+get', () => {
  bench('nanosignals', () => {
    const s1 = sig(1);
    const s2 = sig(1);
    const s3 = sig(1);
    const s4 = sig(1);
    const s5 = sig(1);
    const s6 = sig(1);
    const s7 = sig(1);
    const s8 = sig(1);
    const s9 = sig(1);
    const s = sig(() => s1.val + s2.val + s3.val + s4.val + s5.val + s6.val + s7.val + s8.val + s9.val);
    s5.val = (s5.val + 1);
    assert(s.val === 10);
  })

  bench('solid-js', () => {
    createRoot(() => {
      const [s1] = createSignal(1);
      const [s2] = createSignal(1);
      const [s3] = createSignal(1);
      const [s4] = createSignal(1);
      const [s5, setS5] = createSignal(1);
      const [s6] = createSignal(1);
      const [s7] = createSignal(1);
      const [s8] = createSignal(1);
      const [s9] = createSignal(1);
      const s = createMemo(() => s1() + s2() + s3() + s4() + s5() + s6() + s7() + s8() + s9());
      setS5(s5() + 1);
      assert(s() === 10);
    })
  })

  bench("preact", () => {
    const s1 = signal(1);
    const s2 = signal(1);
    const s3 = signal(1);
    const s4 = signal(1);
    const s5 = signal(1);
    const s6 = signal(1);
    const s7 = signal(1);
    const s8 = signal(1);
    const s9 = signal(1);
    const s = computed(() => s1.value + s2.value + s3.value + s4.value + s5.value + s6.value + s7.value + s8.value + s9.value);
    s5.value = s5.value + 1;
    assert(s.value === 10);
  });

  bench("reactively", () => {
    const s1 = reactive(1);
    const s2 = reactive(1);
    const s3 = reactive(1);
    const s4 = reactive(1);
    const s5 = reactive(1);
    const s6 = reactive(1);
    const s7 = reactive(1);
    const s8 = reactive(1);
    const s9 = reactive(1);
    const s = reactive(() => s1.get() + s2.get() + s3.get() + s4.get() + s5.get() + s6.get() + s7.get() + s8.get() + s9.get());
    s5.set(s5.get() + 1);
    assert(s.get() === 10);
  });
})

describe('direct effect', () => {
  bench('nanosignals', () => {
    const s1 = sig(1);
    const s2 = sig(1);
    let result = 0;
    sig(() => { result = s1.val + s2.val }, { effect: true });
    s2.val = s2.val + 1;
    assert(result === 3);
  });

  bench("solid-js", () => {
    let result = 0;
    createRoot(() => {
      const [s1, setS1] = createSignal(1);
      const [s2, setS2] = createSignal(1);
      createEffect(() => { result = s1() + s2() });
      setS2(s2() + 1);
    })
    assert(result === 3);
  });

  bench("preact", () => {
    const s1 = signal(1);
    const s2 = signal(1);
    let result = 0;
    effect(() => { result = s1.value + s2.value });
    s2.value = s2.value + 1;
    assert(result === 3);
  });

  bench("reactively", () => {
    const s1 = reactive(1);
    const s2 = reactive(1);
    let result = 0;
    reactive(() => { result = s1.value + s2.value }, { effect: true });
    s2.value = s2.value + 1;
    stabilize();
    assert(result === 3);
  });
})


describe('tree effects', () => {
  bench('nanosignals', () => {
    const s1 = sig(1);
    const s2 = sig(1);
    const s3 = sig(1);
    const s4 = sig(1);
    const s5 = sig(() => s1.val + s2.val);
    const s6 = sig(() => s3.val + s4.val);
    sig(() => { s5.val + s6.val }, { effect: true });
    s3.val = s3.val + 1;
    s1.val = s1.val + 1;
  });

  bench("solid-js", () => {
    createRoot(() => {
      const [s1, setS1] = createSignal(1);
      const [s2, setS2] = createSignal(1);
      const [s3, setS3] = createSignal(1);
      const [s4, setS4] = createSignal(1);
      const s5 = createMemo(() => s1() + s2());
      const s6 = createMemo(() => s3() + s4());
      createEffect(() => { s5() + s6() });
      setS3(s3() + 1);
      setS1(s1() + 1);
    })
  });

  bench("preact", () => {
    const s1 = signal(1);
    const s2 = signal(1);
    const s3 = signal(1);
    const s4 = signal(1);
    const s5 = computed(() => s1.value + s2.value);
    const s6 = computed(() => s3.value + s4.value);
    effect(() => { s5.value + s6.value });
    s3.value = s3.value + 1;
    s1.value = s1.value + 1;
  });

  bench("reactively", () => {
    const s1 = reactive(1);
    const s2 = reactive(1);
    const s3 = reactive(1);
    const s4 = reactive(1);
    const s5 = reactive(() => s1.value + s2.value);
    const s6 = reactive(() => s3.value + s4.value);
    reactive(() => { s5.value + s6.value }, { effect: true });
    s3.value = s3.value + 1;
    s1.value = s1.value + 1;
    stabilize();
  });
})

describe('effect with conditions', () => {
  bench('nanosignals', () => {
    const s1 = sig(true);
    const s2 = sig("a");
    const s3 = sig("b");
    const s4 = sig(() => s2.val);
    const s5 = sig(() => s3.val);
    sig(() => s1.val ? s4.val : s5.val, { effect: true });
    s1.val = false;
    s1.val = true;
  });

  bench('solid-js', () => {
    createRoot(() => {
      const [s1, setS1] = createSignal(true);
      const [s2] = createSignal("a");
      const [s3] = createSignal("b");
      const s4 = createMemo(() => s2());
      const s5 = createMemo(() => s3());
      createEffect(() => s1() ? s4() : s5());
      setS1(false);
      setS1(true);
    })
  })

  bench("preact", () => {
    const s1 = signal(true);
    const s2 = signal("a");
    const s3 = signal("b");
    const s4 = computed(() => s2.value);
    const s5 = computed(() => s3.value);
    effect(() => { s1.value ? s4.value : s5.value });
    s1.value = false;
    s1.value = true;
  });

  bench("reactively", () => {
    const s1 = reactive(true);
    const s2 = reactive("a");
    const s3 = reactive("b");
    const s4 = reactive(() => s2.value);
    const s5 = reactive(() => s3.value);
    reactive(() => { s1.value ? s4.value : s5.value }, { effect: true });
    s1.value = false;
    s1.value = true;
    stabilize();
  });
})

describe('wide effects', () => {
  bench('nanosignals', () => {
    const s1 = sig(1);
    const s2 = sig(1);
    const s3 = sig(1);
    const s4 = sig(1);
    const s5 = sig(1);
    const s6 = sig(1);
    const s7 = sig(1);
    const s8 = sig(1);
    const s9 = sig(1);
    sig(() => s1.val + s2.val + s3.val + s4.val + s5.val + s6.val + s7.val + s8.val + s9.val + s1.val + s2.val + s3.val + s4.val + s5.val + s6.val + s7.val + s8.val + s9.val, { effect: true });
    s1.val = s1.val + 1;
    s5.val = s5.val + 1;
    s9.val = s9.val + 1;
  })

  bench('solid-js', () => {
    createRoot(() => {
      const [s1, setS1] = createSignal(1);
      const [s2] = createSignal(1);
      const [s3] = createSignal(1);
      const [s4] = createSignal(1);
      const [s5, setS5] = createSignal(1);
      const [s6] = createSignal(1);
      const [s7] = createSignal(1);
      const [s8] = createSignal(1);
      const [s9, setS9] = createSignal(1);
      createEffect(() => s1() + s2() + s3() + s4() + s5() + s6() + s7() + s8() + s9() + s1() + s2() + s3() + s4() + s5() + s6() + s7() + s8() + s9());
      setS1(s1() + 1);
      setS5(s5() + 1);
      setS9(s9() + 1);
    })
  })

  bench('preact', () => {
    const s1 = signal(1);
    const s2 = signal(1);
    const s3 = signal(1);
    const s4 = signal(1);
    const s5 = signal(1);
    const s6 = signal(1);
    const s7 = signal(1);
    const s8 = signal(1);
    const s9 = signal(1);
    effect(() => { s1.value + s2.value + s3.value + s4.value + s5.value + s6.value + s7.value + s8.value + s9.value + s1.value + s2.value + s3.value + s4.value + s5.value + s6.value + s7.value + s8.value + s9.value });
    s1.value = s1.value + 1;
    s5.value = s5.value + 1;
    s9.value = s9.value + 1;
  })

  bench('reactively', () => {
    const s1 = reactive(1);
    const s2 = reactive(1);
    const s3 = reactive(1);
    const s4 = reactive(1);
    const s5 = reactive(1);
    const s6 = reactive(1);
    const s7 = reactive(1);
    const s8 = reactive(1);
    const s9 = reactive(1);
    reactive(() => { s1.value + s2.value + s3.value + s4.value + s5.value + s6.value + s7.value + s8.value + s9.value + s1.value + s2.value + s3.value + s4.value + s5.value + s6.value + s7.value + s8.value + s9.value }, { effect: true });
    s1.value = s1.value + 1;
    s5.value = s5.value + 1;
    s9.value = s9.value + 1;
    stabilize();
  })
})