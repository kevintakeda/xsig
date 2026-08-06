let EFFECT_QUEUE: Array<Sig> = [],
  SYNC_EFFECTS: Array<Sig> = [],
  CURRENT: undefined | Sig,
  QUEUED = 0,
  UNTRACK = 0,
  SCOPE: undefined | Array<Sig>;

export type EffectType = 0 | 1 | 2;

type Edge = {
  s: Sig; // source
  o: Sig; // observer
  ns?: Edge | null; // next in source's observer chain
  ps?: Edge | null; // prev in source's observer chain
  nd?: Edge | null; // next in observer's dependency chain
  pd?: Edge | null; // prev in observer's dependency chain
  k: boolean;
};

const E = (a1: unknown, a2: unknown) => a1 === a2;

export class Sig<T = unknown> {
  #effect?: EffectType;
  #compute: (() => T) | undefined | null;
  #cache: T | undefined | (() => void);
  #depHead?: Edge | null;
  #obsHead?: Edge | null;
  #obsTail?: Edge | null;
  #stale = true;
  #scope?: Array<Sig>;

  eq: (a1: unknown, a2: unknown) => boolean = E;

  constructor(
    value: () => T,
    computation: true,
    effect?: EffectType,
    scope?: Array<Sig>,
  );
  constructor(
    value?: T,
    computation?: false | undefined,
    effect?: EffectType,
    scope?: Array<Sig>,
  );
  constructor(
    value: (() => T) | T,
    computation?: boolean,
    effect?: EffectType,
    scope?: Array<Sig>,
  ) {
    // @ts-ignore
    if (computation) {
      if (scope) this.#scope = scope;
      SCOPE?.push(this);
      this.#compute = value as () => T;
      if (effect) {
        this.#effect = effect;
        if (effect < 2) (EFFECT_QUEUE.push(this), queueEffects());
        else this.#execute();
      }
    } else {
      this.#cache = value;
      this.#stale = false;
    }
  }

  #unlink(e: Edge) {
    const s = e.s,
      o = e.o;
    if (e.ps) e.ps.ns = e.ns;
    else s.#obsHead = e.ns;
    if (e.ns) e.ns.ps = e.ps;
    else s.#obsTail = e.ps;
    if (e.pd) e.pd.nd = e.nd;
    else o.#depHead = e.nd;
    if (e.nd) e.nd.pd = e.pd;
    if (!s.#obsHead && s.#compute && !s.#effect) {
      s.#stale = true;
      let e2 = s.#depHead;
      while (e2) {
        const n = e2.nd;
        s.#unlink(e2);
        e2 = n;
      }
    }
  }

  // pulls stale graph; true = re-eval'd + same
  #updateIfNecessary(): boolean {
    if (!this.#compute || !this.#stale) return false;
    if (!this.#depHead) return this.eq(this.#cache, this.#execute());
    let e: Edge | null | undefined = this.#depHead;
    while (e) {
      if (!e.s.#updateIfNecessary())
        return this.eq(this.#cache, this.#execute());
      e = e.nd;
    }
    this.#stale = false;
    return false;
  }

  /** @internal executes the function and track dependencies */
  #execute(disconnect = false) {
    // @ts-ignore
    if (this.#cache?.call && this.#effect) this.#cache();
    const prev = CURRENT;
    let e = this.#depHead;
    while (e) {
      e.k = false;
      e = e.nd;
    }
    CURRENT = this;
    if (!disconnect) {
      const prevScope = SCOPE;
      if (this.#scope) SCOPE = this.#scope;
      const prevUntrack = UNTRACK;
      UNTRACK = 0;
      this.#cache = this.#compute?.();
      UNTRACK = prevUntrack;
      SCOPE = prevScope;
    }

    e = this.#depHead;
    while (e) {
      const n = e.nd;
      if (!e.k) this.#unlink(e);
      e = n;
    }
    this.#stale = false;
    CURRENT = prev;
    return this.#cache;
  }

  #setStale() {
    if (this.#stale) return;
    this.#stale = true;
    if (this.#effect === 2) SYNC_EFFECTS.push(this);
    else if (this.#effect) (EFFECT_QUEUE.push(this), queueEffects());
    else {
      let e = this.#obsHead;
      while (e) {
        e.o.#setStale();
        e = e.ns;
      }
      if (!this.#compute) this.#stale = false;
    }
  }

  get value(): T {
    const c = CURRENT;
    if (c) {
      let e: Edge | null | undefined = c.#depHead;
      while (e) {
        if (e.s === this) break;
        e = e.nd;
      }
      if (e) e.k = true;
      else if (!UNTRACK) {
        e = {
          s: this,
          o: c,
          ps: this.#obsTail,
          nd: c.#depHead,
          k: true,
        };
        if (this.#obsTail) this.#obsTail.ns = e;
        else this.#obsHead = e;
        this.#obsTail = e;
        if (c.#depHead) c.#depHead.pd = e;
        c.#depHead = e;
      }
    }
    this.#updateIfNecessary();
    return this.#cache as T;
  }

  get peek(): T {
    UNTRACK++;
    this.value;
    UNTRACK--;
    return this.#cache as T;
  }

  set value(newValue: T | null) {
    if (this.#compute) {
      this.#execute(true);
      this.#effect = 0;
      this.#compute = null;
      if (this.#scope?.length) for (const s of this.#scope) s.value = null;
    }
    if (this.eq(this.#cache, newValue)) return;
    this.#cache = newValue as T;
    this.#setStale();
    flushSyncEffects();
  }
}

function flushSyncEffects() {
  untrack(() => {
    while (SYNC_EFFECTS.length) {
      const batch = SYNC_EFFECTS;
      SYNC_EFFECTS = [];
      for (const s of batch) s.value;
    }
  });
}

function queueEffects() {
  if (QUEUED) return;
  QUEUED = 1;
  queueMicrotask(() => (flushSync(), (QUEUED = 0)));
}

export function untrack<T>(fn: () => T): T {
  UNTRACK++;
  const r = fn();
  UNTRACK--;
  return r;
}

export function flushSync() {
  flushSyncEffects();
  while (EFFECT_QUEUE.length) {
    const batch = EFFECT_QUEUE;
    EFFECT_QUEUE = [];
    for (const s of batch) s.value;
  }
}
export function signal<T>(value: T): Sig<T>;
export function signal<T = undefined>(): Sig<T | undefined>;
export function signal<T>(value?: T): Sig<T> {
  return new Sig<T>(value);
}

export function computed<T>(fn: () => T) {
  return new Sig<T>(fn, true);
}

export function effect<T>(fn: () => T, sync?: boolean, scope?: Array<Sig>) {
  const data = new Sig<T>(fn, true, sync ? 2 : 1, scope);
  return () => (data.value = null);
}
