let EFFECT_QUEUE: Array<Sig> = [],
  QUEUED = false,
  CURRENT: undefined | Sig,
  eq = (a1: any, a2: any) => a1 === a2;

export interface NanoSignalOptions {
  effect?: boolean;
  eq?: (a: unknown, b: unknown) => boolean;
}

export class Sig<T = unknown> {
  #effect: boolean | undefined;
  #compute: (() => T) | undefined | null;
  #cache: T | undefined | (() => void);
  #sources: Array<Sig> = [];
  #observers: Array<Sig> = [];
  #stale = true;

  eq: (a1: unknown, a2: unknown) => boolean = eq;

  constructor(value: () => T, computation: true, effect?: boolean);
  constructor(value?: T, computation?: false | undefined, effect?: boolean);
  constructor(value: (() => T) | T, computation?: boolean, effect?: boolean) {
    // @ts-ignore
    if (computation) {
      this.#compute = value as () => T;
      if (effect) {
        this.#effect = effect;
        if (CURRENT && CURRENT.#effect) {
          this.value;
        } else {
          EFFECT_QUEUE.push(this);
          queueEffects();
        }
      }
    } else {
      this.#cache = value;
    }
  }

  // it updates itself (if necessary) and returns if the updated value is the same as before
  #updateIfNecessary(): boolean {
    return (
      !!this.#compute &&
      this.#stale &&
      (!this.#sources.length ||
        this.#sources.some((el) => !el.#updateIfNecessary())) &&
      this.eq(this.#cache, this.#execute())
    );
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
    if (this.#effect) EFFECT_QUEUE.push(this), queueEffects();
    else this.#observers.forEach((el) => !el.#stale && el.#setStale());
    this.#stale = true;
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
      this.#effect = false;
      this.#compute = null;
    }
    if (this.eq(this.#cache, newValue)) return;
    this.#cache = newValue as T;
    this.#setStale();
  }
}

export function flushSync() {
  EFFECT_QUEUE.forEach((el) => el.value);
  EFFECT_QUEUE = [];
}

export function queueEffects() {
  if (QUEUED) return;
  QUEUED = true;
  queueMicrotask(() => (flushSync(), (QUEUED = false)));
}
export function signal<T>(value: T, eq?: (a1: any, a2: any) => boolean): Sig<T>;
export function signal<T = undefined>(): Sig<T | undefined>;
export function signal<T>(
  value?: T,
  eq?: (a1: any, a2: any) => boolean
): Sig<T> {
  const data = new Sig<T>(value);
  if (eq) data.eq = eq;
  return data;
}

export function effect<T>(fn: () => T, eq?: (a1: any, a2: any) => boolean) {
  const data = new Sig<T>(fn, true, true);
  if (eq) data.eq = eq;
  return () => {
    data.value = null;
  };
}

export function computed<T>(fn: () => T, eq?: (a1: any, a2: any) => boolean) {
  const data = new Sig<T>(fn, true);
  if (eq) data.eq = eq;
  return data;
}
