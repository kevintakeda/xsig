# nanosignals

A very tiny reactive library, highly inspired by [Reactively](https://github.com/milomg/reactively).

- Signals-based observers
- Only **431 bytes** (minified and brotlified)
- Fine grained updates (updates only when necessary)
- Computations are lazy by default
- Auto depedency tracking
- Easy and predictable

## Example

```js
import { Sig } from "nanosignals";

// A "data source".
const number = new Sig(1);

// A "memo" that executes only when `double.val` is read.
const double = new Sig(() => number.val * 2);

// An "effect" that executes only if `double` changes.
const effect = new Sig(() => {
  console.log("double is: " + double.val);
  return () => {
    /* clean up code if needed */
  };
}, /* here we specify that is a signal */ true);

// logs "double is: 4".
Sig.tick();

// does nothing.
Sig.tick();

// if you don't want to call `tick()` everytime
// you can setup a microtask scheduler:
Sig.autoTick();

// logs "double is: 0" *almost instantly*
number.val = 0;

// To stop an effect just set a value and now the efect becomes a data source
effect.val = null;
```
