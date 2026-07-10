let EFFECT_QUEUE: Array<Sig> = [],
  SYNC_EFFECTS: Array<Sig> = [],
  CURRENT: undefined | Sig,
  QUEUED = 0,
  UNTRACK = 0,
  SCOPE: undefined | Array<Sig>;

export type EffectType = 0 | 1 | 2;
export class Sig<T = unknown> {
  #stale = true;
  #effect: EffectType = 0;
  #sources: Array<Sig> = [];
  #observers: Array<Sig> = [];
  #compute: (() => T) | undefined | null;
  #cache: T | undefined | (() => void);

  #scope?: Array<Sig>;

  eq: (a1: unknown, a2: unknown) => boolean = (a1: any, a2: any) => a1 === a2;

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

  // pulls stale graph; true = re-eval'd + same
  #updateIfNecessary(): boolean {
    if (!this.#compute || !this.#stale) return false;
    if (
      !this.#sources.length ||
      this.#sources.some((el) => !el.#updateIfNecessary())
    ) {
      return this.eq(this.#cache, this.#execute());
    }
    this.#stale = false;
    return false;
  }

  /** @internal executes the function and track dependencies */
  #execute(disconnect = false) {
    // @ts-ignore
    if (this.#cache?.call && this.#effect) this.#cache();
    const prev = CURRENT,
      prevSources = this.#sources;
    this.#sources = [];
    CURRENT = this;
    if (!disconnect) {
      const prevScope = SCOPE;
      if (this.#scope) SCOPE = this.#scope;
      this.#cache = this.#compute?.();
      SCOPE = prevScope;
    }

    this.#stale = false;
    for (const source of prevSources)
      if (!this.#sources.includes(source))
        source.#observers.splice(source.#observers.indexOf(this), 1);
    CURRENT = prev;
    return this.#cache;
  }

  #dispose() {
    if (this.#scope?.length) for (const s of this.#scope) s.value = null;
  }

  #setStale() {
    if (this.#stale) return;
    this.#stale = true;
    if (this.#effect > 1) SYNC_EFFECTS.push(this);
    else if (this.#effect) (EFFECT_QUEUE.push(this), queueEffects());
    else {
      this.#observers.forEach((el) => el.#stale || el.#setStale());
      if (!this.#compute) this.#stale = false;
    }
  }

  get peek(): T {
    const prev = UNTRACK;
    UNTRACK = 1;
    this.value;
    UNTRACK = prev;
    return this.#cache as T;
  }

  get value(): T {
    if (CURRENT) {
      if (!~CURRENT.#sources.indexOf(this)) CURRENT.#sources.push(this);
      if (!UNTRACK && !~this.#observers.indexOf(CURRENT))
        this.#observers.push(CURRENT);
    }
    this.#updateIfNecessary();
    return this.#cache as T;
  }

  set value(newValue: T | null) {
    if (this.#compute) {
      this.#execute(true);
      this.#effect = 0;
      this.#compute = null;
      this.#dispose();
    }
    if (this.eq(this.#cache, newValue)) return;
    this.#cache = newValue as T;
    this.#setStale();
    flushSyncEffects();
  }
}

function flushSyncEffects() {
  while (SYNC_EFFECTS.length) {
    const batch = SYNC_EFFECTS;
    SYNC_EFFECTS = [];
    for (const s of batch) s.value;
  }
}

function queueEffects() {
  if (QUEUED) return;
  QUEUED = 1;
  queueMicrotask(() => (flushSync(), (QUEUED = 0)));
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
  const data = new Sig<T>(value);
  return data;
}

export function computed<T>(fn: () => T) {
  const data = new Sig<T>(fn, true);
  return data;
}

export function effect<T>(fn: () => T, sync?: boolean, scope?: Array<Sig>) {
  const data = new Sig<T>(fn, true, sync ? 2 : 1, scope);
  return () => (data.value = null);
}
