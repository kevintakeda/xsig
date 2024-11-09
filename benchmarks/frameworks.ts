import { Sig } from "../src";
import { Signal } from "signal-polyfill";
import { Reactive, stabilize } from "@reactively/core";
import {
  signal as psignal,
  effect as peffect,
  computed as pcomputed,
  batch as pbatch,
} from "@preact/signals-core";
import {
  batch as sbatch,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
} from "solid-js/dist/solid.cjs";
import {
  root as mroot,
  signal as msignal,
  computed as mcomputed,
  effect as meffect,
  tick as mtick,
} from "@maverick-js/signals";

export interface SignalApi {
  signal<T>(val: T): {
    get(): T;
    set(v: T): void;
  };
  computed<T>(fn: () => T): {
    get(): T;
  };
  effect(fn: () => void): void;
  runSync<T>(fn: () => T): void;
  root<T>(fn: () => T): T;
}

export const NanoSignals: SignalApi = {
  signal: (val) => {
    const S = new Sig(val);
    return {
      set: (v) => (S.val = v),
      get: () => S.val,
    };
  },
  computed: (fn) => {
    const S = new Sig(fn);
    return {
      get: () => S.val,
    };
  },
  effect: (fn) => new Sig(fn, true),
  runSync: (fn) => {
    fn();
    Sig.tick();
  },
  root: (fn) => fn(),
};

export const Reactively: SignalApi = {
  signal: (val) => {
    const S = new Reactive(val);
    return {
      set: (v) => S.set(v),
      get: () => S.get(),
    };
  },
  computed: (fn) => {
    const S = new Reactive(fn);
    return {
      get: () => S.get(),
    };
  },
  effect: (fn) => new Reactive(fn, true),
  runSync: (fn) => {
    fn();
    stabilize();
  },
  root: (fn) => fn(),
};

export const PreactSignals: SignalApi = {
  signal: (val) => {
    const S = psignal(val);
    return {
      set: (v) => (S.value = v),
      get: () => S.value,
    };
  },
  computed: (fn) => {
    const S = pcomputed(fn);
    return {
      get: () => S.value,
    };
  },
  effect: (fn) => peffect(fn),
  runSync: (fn) => pbatch(fn),
  root: (fn) => fn(),
};

export const SolidSignals: SignalApi = {
  signal: (val) => {
    const [S, setter] = createSignal(val);
    return {
      set: (v) => setter(v),
      get: () => S(),
    };
  },
  computed: (fn) => {
    const S = createMemo(fn);
    return {
      get: () => S(),
    };
  },
  effect: (fn) => createEffect(fn),
  runSync: (fn) => sbatch(fn),
  root: (fn) => createRoot(fn),
};

export const MaverickSignals: SignalApi = {
  signal: (val) => {
    const S = msignal(val);
    return {
      set: (v) => S.set(v),
      get: () => S(),
    };
  },
  computed: (fn) => {
    const S = mcomputed(fn);
    return {
      get: () => S(),
    };
  },
  effect: (fn) => meffect(fn),
  runSync: (fn) => {
    fn();
    mtick();
  },
  root: (fn) => mroot(fn),
};

namespace SignalUtils {
  let needsEnqueue = true;

  const w = new Signal.subtle.Watcher(() => {
    // if (needsEnqueue) {
    //   needsEnqueue = false;
    //   queueMicrotask(processPending);
    // }
  });

  export function processPending() {
    needsEnqueue = true;

    for (const s of w.getPending()) {
      s.get();
    }

    w.watch();
  }

  export function effect(callback) {
    let cleanup;

    const computed = new Signal.Computed(() => {
      typeof cleanup === "function" && cleanup();
      cleanup = callback();
    });

    w.watch(computed);
    // computed.get();

    return () => {
      w.unwatch(computed);
      typeof cleanup === "function" && cleanup();
      cleanup = undefined;
    };
  }
}

export const SignalPolyfill: SignalApi = {
  signal: (val) => {
    const S = new Signal.State(val);
    return {
      set: (v) => S.set(v),
      get: () => S.get(),
    };
  },
  computed: (fn) => {
    const S = new Signal.Computed(fn);
    return {
      get: () => S.get(),
    };
  },
  effect: (fn) => SignalUtils.effect(fn),
  runSync: (fn) => {
    fn();
    SignalUtils.processPending();
  },
  root: (fn) => mroot(fn),
};
