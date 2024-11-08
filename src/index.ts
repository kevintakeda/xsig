let EFFECT_QUEUE: Array<NanoSignal> = [],
  QUEUED = false,
  CURRENT: undefined | NanoSignal,
  queueFn: (() => void) | undefined;

export interface NanoSignalOptions {
  effect?: boolean;
  equals?: (a: unknown, b: unknown) => boolean;
}

export class NanoSignal<T = unknown> {
  #effect: boolean | undefined;
  #compute: (() => T) | undefined;
  #cache: T | undefined | (() => void);
  #sources: Array<NanoSignal> = [];
  #observers: Array<NanoSignal> = [];
  #dirty = true;

  equals: (a1: unknown, a2: unknown) => boolean;

  constructor(value: (() => T) | T, options?: NanoSignalOptions) {
    if (typeof value === "function") {
      this.#compute = value as () => T;
      if (options?.effect) {
        this.#effect = options?.effect;
        EFFECT_QUEUE.push(this);
        queueFn?.();
      }
    } else {
      this.#cache = value;
    }
    this.equals = options?.equals ?? ((a1, a2) => a1 === a2)
  }

  // it updates itself and returns if the value was the same
  #updateIfNecessary(): boolean {
    return (!!this.#compute && this.#dirty)
      && (!this.#sources.length || this.#sources.some(el => !el.#updateIfNecessary()))
      && (this.#cache === this.e());
  }

  /* @internal */
  e(disconnect = false) {
    this.#sources.forEach(el => {
      const idx = el.#observers.indexOf(this);
      if (~idx) el.#observers.splice(idx, 1)
    })
    if (typeof this.#cache === "function") (this.#cache as (() => void))();
    this.#sources = [];
    const prev = CURRENT;
    CURRENT = this;
    if (!disconnect)
      this.#cache = this.#compute?.();
    this.#dirty = false;
    CURRENT = prev;
    return this.#cache
  }

  #mark() {
    if (this.#effect && !this.#dirty) EFFECT_QUEUE.push(this)
    else if (!this.#observers.every(el => el.#dirty)) this.#observers.forEach(el => el.#mark())
    this.#dirty = true
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
      this.#compute = undefined;
    }
    if (!this.equals(this.#cache, newValue)) {
      this.#cache = newValue as T;
      this.#mark();
      queueFn?.();
    }
  }
}

export function signal<T = unknown>(
  value: T | (() => T),
  options?: NanoSignalOptions,
): NanoSignal<T> {
  return new NanoSignal<T>(value, options);
}

export function tick() {
  EFFECT_QUEUE.forEach(el => el.e())
  EFFECT_QUEUE = []
}

export function queueTick() {
  if (!QUEUED) {
    QUEUED = true;
    queueMicrotask(() => (tick(), QUEUED = false));
  }
}

export function autoTick(fn = queueTick) {
  queueFn = fn;
}