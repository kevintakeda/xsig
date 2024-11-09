let EFFECT_QUEUE: Array<Sig> = [],
  QUEUED = false,
  CURRENT: undefined | Sig,
  queueFn: (() => void) | undefined;

export interface NanoSignalOptions {
  effect?: boolean;
  eq?: (a: unknown, b: unknown) => boolean;
}

export class Sig<T = unknown> {
  #effect: boolean | undefined;
  #compute: (() => T) | undefined;
  #cache: T | undefined | (() => void);
  #sources: Array<Sig> = [];
  #observers: Array<Sig> = [];
  #stale = true;

  eq: (a1: unknown, a2: unknown) => boolean = ((a1, a2) => a1 === a2);

  constructor(value: (() => T) | T, effect?: boolean, equals?: (a1: unknown, a2: unknown) => boolean) {
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
    if (equals) this.eq = equals;
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
      // @ts-expect-error null for less size
      this.#compute = null;
    }
    if (this.eq(this.#cache, newValue)) return
    this.#cache = newValue as T;
    this.#setStale();
    queueFn?.();
  }

  static tick() {
    EFFECT_QUEUE.forEach(el => el.e())
    EFFECT_QUEUE = []
  }

  static autoTick(fn = Sig.queueTick) {
    queueFn = fn;
  }

  static queueTick() {
    if (QUEUED) return
    QUEUED = true;
    queueMicrotask(() => (Sig.tick(), QUEUED = false));
  }
}