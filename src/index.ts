let EFFECT_QUEUE: Array<NanoSignal> = [],
  QUEUED = false,
  CURRENT: undefined | NanoSignal,
  V = 0,
  queueFn: (() => void) | undefined;

export interface NanoSignalOptions {
  effect?: boolean;
  equals?: (a: unknown, b: unknown) => boolean;
}

export class NanoSignal<T = unknown> {
  #effect: boolean | undefined;
  #compute: (() => T) | undefined;
  #cache: T | undefined;
  #sources: Array<NanoSignal> = [];
  #observers: Array<NanoSignal> = [];
  #dirty = true;
  #version: number = -1

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
      && (this.#sources.length === 0 || this.#sources.some(el => !el.#updateIfNecessary()))
      && (this.#cache === this._exec());
  }

  /* @internal */
  _exec() {
    for (const el of this.#sources) {
      const idx = el.#observers.indexOf(this);
      if (idx !== -1) el.#observers.splice(idx, 1)
    }
    this.#sources = [];
    const prev = CURRENT;
    CURRENT = this;
    this.#cache = this.#compute?.();
    this.#dirty = false;
    CURRENT = prev;
    return this.#cache
  }

  #mark() {
    if (this.#version === V) return
    this.#version = V
    const prevDirty = this.#dirty
    this.#dirty = true
    if (this.#effect && !prevDirty) EFFECT_QUEUE.push(this)
    else for (const el of this.#observers) el.#mark()
  }

  get val(): T {
    if (CURRENT) {
      if (this.#observers.indexOf(CURRENT) === -1) this.#observers.push(CURRENT);
      if (CURRENT.#sources.indexOf(this) === -1) CURRENT.#sources.push(this);
    }
    this.#updateIfNecessary()
    return this.#cache as T;
  }

  set val(newValue: T | null) {
    if (!this.equals(this.#cache, newValue)) {
      this.#cache = newValue as T;
      this.#compute = undefined;
      V++
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
  for (const el of EFFECT_QUEUE) el._exec()
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