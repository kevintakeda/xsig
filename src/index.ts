let EFFECT_QUEUE: Array<Sig> = [],
  QUEUED = false,
  CURRENT: undefined | Sig;

export type EffectType = 0 | 1 | 2;
export class Sig<T = unknown> {
  #effect: EffectType = 0;
  #compute: (() => T) | undefined | null;
  #cache: T | undefined | (() => void);
  #sources: Array<Sig> = [];
  #observers: Array<Sig> = [];
  #stale = true;

  eq: (a1: unknown, a2: unknown) => boolean = (a1: any, a2: any) => a1 === a2;

  constructor(value: () => T, computation: true, effect?: EffectType);
  constructor(value?: T, computation?: false | undefined, effect?: EffectType);
  constructor(
    value: (() => T) | T,
    computation?: boolean,
    effect?: EffectType,
  ) {
    // @ts-ignore
    if (computation) {
      this.#compute = value as () => T;
      if (effect) {
        this.#effect = effect;
        effect < 2
          ? (EFFECT_QUEUE.push(this), queueEffects())
          : this.#execute();
      }
    } else {
      this.#cache = value;
      this.#stale = false;
    }
  }

  // it updates itself (if necessary) and returns if the updated value is the same as before
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
    if (!!this.#cache?.call) (this.#cache as () => void)();
    const prev = CURRENT,
      prevSources = this.#sources;
    this.#sources = [];
    CURRENT = this;
    if (!disconnect) this.#cache = this.#compute?.();
    this.#stale = false;
    prevSources.forEach((prev, i) => {
      if (this.#sources[i] !== prev && !~this.#sources.indexOf(prev))
        prev.#observers.splice(prev.#observers.indexOf(this), 1);
    });
    CURRENT = prev;
    return this.#cache;
  }

  #setStale() {
    if (this.#stale) return;
    this.#stale = true;
    if (this.#effect > 1) this.#execute();
    else if (this.#effect) (EFFECT_QUEUE.push(this), queueEffects());
    else {
      this.#observers.forEach((el) => !el.#stale && el.#setStale());
      if (!this.#compute) this.#stale = false;
    }
  }

  get value(): T {
    if (CURRENT) {
      if (!~this.#observers.indexOf(CURRENT)) this.#observers.push(CURRENT);
      if (!~CURRENT.#sources.indexOf(this)) CURRENT.#sources.push(this);
    }
    this.#updateIfNecessary();
    return this.#cache as T;
  }

  set value(newValue: T | null) {
    if (this.#compute) {
      this.#execute(true);
      this.#effect = 0;
      this.#compute = null;
    }
    if (this.eq(this.#cache, newValue)) return;
    this.#cache = newValue as T;
    this.#setStale();
  }
}

export function flushSync() {
  while (EFFECT_QUEUE.length) {
    const batch = EFFECT_QUEUE;
    EFFECT_QUEUE = [];
    for (const effect of batch) effect.value;
  }
}

function queueEffects() {
  if (QUEUED) return;
  QUEUED = true;
  queueMicrotask(() => (flushSync(), (QUEUED = false)));
}
export function signal<T>(value: T, eq?: (a1: any, a2: any) => boolean): Sig<T>;
export function signal<T = undefined>(): Sig<T | undefined>;
export function signal<T>(
  value?: T,
  eq?: (a1: any, a2: any) => boolean,
): Sig<T> {
  const data = new Sig<T>(value);
  if (eq) data.eq = eq;
  return data;
}

export function effect<T>(fn: () => T, sync?: boolean) {
  const data = new Sig<T>(fn, true, sync ? 2 : 1);
  return () => (data.value = null);
}

export function computed<T>(fn: () => T, eq?: (a1: any, a2: any) => boolean) {
  const data = new Sig<T>(fn, true);
  if (eq) data.eq = eq;
  return data;
}
