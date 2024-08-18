let TRACK_DEPS: undefined | Array<NanoSignal>,
  PREV_DEPS: undefined | Array<NanoSignal>,
  GLOBAL_V = 0, CALL_V = 1,
  STATE_ACCESSES: Array<NanoSignal> | undefined;

export class NanoSignal<T = unknown> {
  #effect: boolean | undefined;
  #compute: (() => T) | undefined;

  #cache: T | undefined;
  #deps: Array<NanoSignal> = [];
  #states: Array<NanoSignal> = [];

  #version: number = 0;
  #contentVersion: number = 0;

  #effects: Array<NanoSignal> = [];

  constructor(value: (() => T) | T, effect?: boolean, defer?: boolean) {
    if (typeof value === "function") {
      this.#compute = value as (() => T);
      if (effect) {
        this.#effect = effect;
        STATE_ACCESSES = [];
        if (!defer) this.#update();
        STATE_ACCESSES = undefined;
      }
    } else {
      this.#cache = value;
    }
  }

  // Should only be called if 'compute' is defined.
  #update() {
    PREV_DEPS = TRACK_DEPS;
    this.#deps = []
    TRACK_DEPS = this.#deps;

    this.#cache = this.#compute!();

    if (STATE_ACCESSES && this.#effect) {
      STATE_ACCESSES.forEach(a => {
        if (this.#states.indexOf(a) === -1) {
          this.#states.push(a);
          if (a.#effects.indexOf(this) === -1) a.#effects.push(this)
        }
      })
    }

    this.#version = CALL_V;
    this.#contentVersion = this.#version;
    TRACK_DEPS = PREV_DEPS;
    PREV_DEPS = undefined;
  }

  #tryUpdate(version: number): number {
    // Return -1 if update is not needed, or the version to be updated.
    let ourVersion = this.#contentVersion;
    if (version >= ourVersion) {
      if (this.#compute) {
        const notDirty = !(this.#version === 0 ||
          this.#deps.some(dep => {
            const depVersion = dep.#tryUpdate(version);
            if (depVersion > ourVersion) {
              ourVersion = depVersion;
              return true
            }
          }));
        if (notDirty) return -1;
        let prev = this.#cache, prevVer = this.#version;
        this.#update();
        if (Object.is(prev, this.#cache)) {
          this.#contentVersion = prevVer;
          return -1
        }
      } else return -1
    }
    return ourVersion
  }

  get val(): T {
    if (TRACK_DEPS && TRACK_DEPS.indexOf(this) === -1) TRACK_DEPS.push(this);

    if (this.#version !== CALL_V) {
      if (this.#compute) {
        this.#tryUpdate(this.#version);
      } else if (STATE_ACCESSES) {
        STATE_ACCESSES.push(this);
      }
    }
    return this.#cache as T
  }

  set val(newValue: T | null) {
    if (!Object.is(this.#cache, newValue)) {
      this.#cache = newValue as T;
      this.#version = ++GLOBAL_V;
      CALL_V = this.#version;
      this.#contentVersion = this.#version
      this.#compute = undefined;

      STATE_ACCESSES = [];
      this.#effects.forEach(node => node.#tryUpdate(node.#version));
      STATE_ACCESSES = undefined;
    }
  }
}

interface NanoSignalOptions {
  effect?: boolean
  name?: string
  defer?: boolean
}
export function signal<T = unknown>(value: T | (() => T), options?: NanoSignalOptions): NanoSignal<T> {
  return new NanoSignal<T>(value, options?.effect, options?.defer)
}
