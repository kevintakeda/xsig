import { bench, describe } from "vitest";
import { signal, computed, effect, flushSync, Sig } from "../src";
import {
  signal as psignal,
  effect as peffect,
  computed as pcomputed,
} from "@preact/signals-core";
import {
  signal as asignal,
  computed as acomputed,
  effect as aeffect,
  effectScope as aeffectScope,
} from "alien-signals";

const N = 10000;

// ── simple: create + dispose N effects (flat, same source) ──

describe(`create + dispose ${N} simple effects`, () => {
  bench("xsig", () => {
    const s = signal(1);
    const d = Array.from({ length: N }, () => effect(() => s.value));
    for (const x of d) x();
  });

  bench("preact", () => {
    const s = psignal(1);
    const d = Array.from({ length: N }, () => peffect(() => s.value));
    for (const x of d) x();
  });

  bench("alien-signals", () => {
    const s = asignal(1);
    const d = Array.from({ length: N }, () => aeffect(() => s()));
    for (const x of d) x();
  });
});

// ── chain: N × (signal → computed → effect) ──

describe(`create + dispose ${N} signal → computed → effect chains`, () => {
  bench("xsig", () => {
    const s = signal(1);
    const d = Array.from({ length: N }, () => {
      const c = computed(() => s.value);
      return effect(() => c.value);
    });
    for (const x of d) x();
  });

  bench("preact", () => {
    const s = psignal(1);
    const d = Array.from({ length: N }, () => {
      const c = pcomputed(() => s.value);
      return peffect(() => c.value);
    });
    for (const x of d) x();
  });

  bench("alien-signals", () => {
    const s = asignal(1);
    const d = Array.from({ length: N }, () => {
      const c = acomputed(() => s());
      return aeffect(() => c());
    });
    for (const x of d) x();
  });
});

// ── scoped: 1000 rows × (4 computed + 4 effect) inside scope ──
// preact creates same # of effects/computeds but flat (no scope concept)

describe(`create + dispose 1000 scoped rows`, () => {
  const R = 1000;
  const K = 4;

  bench("xsig", () => {
    const s = signal(1);
    const d = Array.from({ length: R }, () => {
      const scope: Sig[] = [];
      return effect(
        () => {
          for (let j = 0; j < K; j++) {
            const c = computed(() => s.value + j);
            effect(() => {
              c.value;
            }, true);
          }
        },
        true,
        scope,
      );
    });
    for (const x of d) x();
    flushSync();
  });

  bench("preact", () => {
    const s = psignal(1);
    const computeds: ReturnType<typeof pcomputed>[] = [];
    const effects: (() => void)[] = [];
    for (let i = 0; i < R; i++) {
      effects.push(peffect(() => s.value));
      for (let j = 0; j < K; j++) {
        const c = pcomputed(() => s.value + j);
        computeds.push(c);
        effects.push(peffect(() => c.value));
      }
    }
    for (const x of effects) x();
  });

  bench("alien-signals", () => {
    const s = asignal(1);
    const d = Array.from({ length: R }, () =>
      aeffectScope(() => {
        for (let j = 0; j < K; j++) {
          const c = acomputed(() => s() + j);
          aeffect(() => {
            c();
          });
        }
      }),
    );
    for (const x of d) x();
  });
});
