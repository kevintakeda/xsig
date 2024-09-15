let TRACK_DEPS: undefined | Array<NanoSignal>,
  PREV_DEPS: undefined | Array<NanoSignal>,
  TRACK_ALL: undefined | Array<NanoSignal>,
  GLOBAL_V = 0,
  CALL_V = 1,
  EFFECT_QUEUE: Array<NanoSignal> = [],
  QUEUED = 0;

export class NanoSignal<T = unknown> {
  #effect: boolean | undefined;
  #compute: (() => T) | undefined;

  #cache: T | undefined;
  #deps: Array<NanoSignal> = [];

  #version: number = 0;
  #contentVersion: number = 0;

  #effects: Array<NanoSignal> = [];

  equals = (a1: unknown, a2: unknown) => a1 === a2;
  autoFlush = false;

  constructor(value: (() => T) | T, effect?: boolean) {
    if (typeof value === "function") {
      this.#compute = value as () => T;
      if (effect) {
        this.#effect = effect;
        EFFECT_QUEUE.push(this);
      }
    } else {
      this.#cache = value;
    }
  }

  // Should only be called if 'compute' is defined.
  #update() {
    PREV_DEPS = TRACK_DEPS;
    this.#deps = [];
    TRACK_DEPS = this.#deps;

    this.#cache = this.#compute!();

    if (this.#effect) {
      TRACK_ALL?.forEach((a) => {
        if (a.#effects.indexOf(this) === -1) a.#effects.push(this);
      });
    }

    this.#version = CALL_V;
    this.#contentVersion = this.#version;
    TRACK_DEPS = PREV_DEPS;
    PREV_DEPS = undefined;
  }

  #tryUpdate(version?: number): number {
    // Return -1 if update is not needed, or the version to be updated.
    if (!version) version = this.#version;
    let ourVersion = this.#contentVersion;
    if (version >= ourVersion) {
      if (this.#compute) {
        const notDirty = !(
          this.#version === 0 ||
          this.#deps.some((dep) => {
            const depVersion = dep.#tryUpdate(version);
            if (depVersion > ourVersion) {
              ourVersion = depVersion;
              return true;
            }
          })
        );
        if (notDirty) return -1;
        let prev = this.#cache,
          prevVer = this.#version;
        this.#update();
        if (this.equals(prev, this.#cache)) {
          this.#contentVersion = prevVer;
          return -1;
        }
      } else return -1;
    }
    return ourVersion;
  }

  get val(): T {
    if (TRACK_DEPS && TRACK_DEPS.indexOf(this) === -1) TRACK_DEPS.push(this);
    if (TRACK_ALL && TRACK_ALL.indexOf(this) === -1) TRACK_ALL.push(this);
    if (this.#compute && this.#version !== CALL_V) {
      this.#tryUpdate(this.#version);
    }
    return this.#cache as T;
  }

  set val(newValue: T | null) {
    if (!this.equals(this.#cache, newValue)) {
      this.#cache = newValue as T;
      this.#version = ++GLOBAL_V;
      CALL_V = this.#version;
      this.#contentVersion = this.#version;
      this.#compute = undefined;
      this.#effects.forEach((node) => {
        if (EFFECT_QUEUE.indexOf(node) === -1) {
          EFFECT_QUEUE.push(node);
        }
      });
      if (this.autoFlush && !QUEUED) {
        QUEUED = 1;
        queueMicrotask(() => (flushEffects(), (QUEUED = 0)));
      }
    }
  }
}

export function flushEffects() {
  EFFECT_QUEUE.forEach((node) => {
    TRACK_ALL = [];
    node.val;
    TRACK_ALL = undefined;
  });
  EFFECT_QUEUE = [];
}

export interface NanoSignalOptions {
  effect?: boolean;
  name?: string;
  equals?: (a: unknown, b: unknown) => boolean;
}

export function signal<T = unknown>(
  value: T | (() => T),
  options?: NanoSignalOptions
): NanoSignal<T> {
  const signal = new NanoSignal<T>(value, options?.effect);
  if (options?.equals) signal.equals = options.equals;
  return signal;
}
