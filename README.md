# nanosignals

A very tiny reactive library, highly inspired by [Reactively](https://github.com/milomg/reactively).

- Signals-based observers
- Only **474 bytes** (minified and brotlified)
- Fine grained updates (updates only when necessary)
- Computations are lazy by default
- Auto depedency tracking
- Easy and predictable

## Example

```js
import { signal, tick, autoTick } from "nanosignals";

// A "data source".
const number = signal(1);

// A "memo" that executes only when `double.val` is read.
const double = signal(() => number.val * 2);

// An "effect" that executes only if `double` changes.
signal(
  () => {
    console.log("double is: " + double.val);
    return () => {
      /* clean up code if needed */
    };
  },
  { effect: true }
);

// logs "double is: 4".
tick();

// does nothing.
tick();

// if you don't want to call `tick()` everytime
// you can setup a microtask scheduler:
autoTick();

// logs "double is: 0"
number.val = 0;

// To stop an effect
const effect = signal(() => console.log("effect"), { effect: true });

// now `effect` act as a regular "data source"
effect.val = null;
```
