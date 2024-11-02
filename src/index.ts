let EFFECT_QUEUE: Array<NanoSignal> = [],
  QUEUED = false,
  CURRENT: undefined | NanoSignal,
  PREV_CURRENT: undefined | NanoSignal, V = 0;

export interface NanoSignalOptions {
  effect?: boolean;
  equals?: (a: unknown, b: unknown) => boolean;
  tick?: () => void
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
  tick: (() => void) | undefined;

  constructor(value: (() => T) | T, options?: NanoSignalOptions) {
    if (typeof value === "function") {
      this.#compute = value as () => T;
      if (options?.effect) {
        this.#effect = options?.effect;
        EFFECT_QUEUE.push(this);
        this.tick?.();
      }
    } else {
      this.#cache = value;
    }
    this.equals = options?.equals ?? ((a1, a2) => a1 === a2)
    this.tick = options?.tick
  }

  // it updates itself and returns if the value was the same
  #updateIfNecessary() {
    if (!this.#compute || !this.#dirty) return false;
    const needsUpdate = this.#sources.length === 0 || this.#sources.some(el => !el.#updateIfNecessary())
    if (needsUpdate && this.#cache === this.e()) return true;
    return false;
  }

  e() {
    if (!this.#compute) return false
    for (const el of this.#sources) {
      const idx = el.#observers.indexOf(this);
      if (idx !== -1) el.#observers.splice(idx, 1)
    }
    this.#sources = [];
    PREV_CURRENT = CURRENT;
    CURRENT = this;
    this.#cache = this.#compute!();
    this.#dirty = false;
    CURRENT = PREV_CURRENT;
    PREV_CURRENT = undefined;
    return this.#cache
  }

  #mark() {
    if (this.#version === V) return
    this.#version = V
    this.#dirty = true
    if (this.#effect && EFFECT_QUEUE.indexOf(this) === -1) EFFECT_QUEUE.push(this)
    else for (const el of this.#observers) el.#mark()
  }

  get val(): T {
    if (CURRENT) {
      if (this.#observers.indexOf(CURRENT) === -1) this.#observers.push(CURRENT);
      if (!this.#effect && CURRENT.#sources.indexOf(this) === -1) CURRENT.#sources.push(this);
    }
    if (this.#compute && this.#dirty) this.#updateIfNecessary()
    return this.#cache as T;
  }

  set val(newValue: T | null) {
    if (!this.equals(this.#cache, newValue)) {
      this.#cache = newValue as T;
      this.#compute = undefined;
      V++
      this.#mark();
      this.tick?.();
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
  for (const el of EFFECT_QUEUE) el.e()
  EFFECT_QUEUE = []
}

export function queueTick() {
  if (!QUEUED) {
    QUEUED = true;
    queueMicrotask(() => (tick(), QUEUED = false));
  }
}