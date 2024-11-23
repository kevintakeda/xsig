let EFFECT_QUEUE: Array<Sig> = [],
  QUEUED = false,
  CURRENT: undefined | Sig,
  queueFn: (() => void) | undefined,
  eq = ((a1: any, a2: any) => a1 === a2);

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

  constructor(value: (() => T) | T, effect?: boolean) {
    // @ts-ignore
    if (!!value?.call) {
      this.#compute = value as () => T;
      if (effect) {
        this.#effect = effect;
        EFFECT_QUEUE.push(this);
        queueFn?.();
      }
    } else {
      this.#cache = value;
    }
  }

  // it updates itself (if necessary) and returns if the updated value is the same as before
  #updateIfNecessary(): boolean {
    return (!!this.#compute && this.#stale)
      && (!this.#sources.length || this.#sources.some(el => !el.#updateIfNecessary()))
      && (this.eq(this.#cache, this.e()));
  }

  /** @internal executes the function and track dependencies */
  e(disconnect = false) {
    // @ts-ignore
    if (!!this.#cache?.call) (this.#cache as (() => void))();
    const prev = CURRENT, prevSources = this.#sources;
    this.#sources = [];
    CURRENT = this;
    if (!disconnect)
      this.#cache = this.#compute?.();
    this.#stale = false;
    prevSources.forEach((prev, i) => {
      if (this.#sources[i] !== prev && !~this.#sources.indexOf(prev))
        prev.#observers.splice(prev.#observers.indexOf(this), 1)
    })
    CURRENT = prev;
    return this.#cache
  }

  #setStale() {
    if (this.#effect) EFFECT_QUEUE.push(this)
    else this.#observers.forEach(el => !el.#stale && el.#setStale())
    this.#stale = true
  }

  get val(): T {
    if (CURRENT) {
      if (!~this.#observers.indexOf(CURRENT)) this.#observers.push(CURRENT);
      if (!~CURRENT.#sources.indexOf(this)) CURRENT.#sources.push(this);
    }
    this.#updateIfNecessary()
    return this.#cache as T;
  }

  set val(newValue: T | null) {
    if (this.#compute) {
      this.e(true);
      this.#effect = false;
      this.#compute = null;
    }
    if (this.eq(this.#cache, newValue)) return
    this.#cache = newValue as T;
    this.#setStale();
    queueFn?.();
  }
}

export function autoTick(fn = queueTick) {
  queueFn = fn;
}

export function tick() {
  EFFECT_QUEUE.forEach(el => el.val)
  EFFECT_QUEUE = []
}

export function queueTick() {
  if (QUEUED) return
  QUEUED = true;
  queueMicrotask(() => (tick(), QUEUED = false));
}