# xsig

A very tiny reactive library, highly inspired by [Reactively](https://github.com/milomg/reactively).

- Signals-based observers
- Only **424 bytes** (minified and brotlified)
- Fine grained updates (updates only when necessary)
- Computations are lazy by default
- Auto depedency tracking
- Easy and predictable

## Install

```
npm install xsig
```

## Example

```js
import { Sig, tick, autoTick } from "xsig";

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
}, /* here we se true to specify that is an effect */ true);

// logs "double is: 4".
tick();

// does nothing.
tick();

// if you don't want to call `tick()` everytime
// you can setup a microtask scheduler:
autoTick();

// logs "double is: 0" *almost instantly*
number.val = 0;

// To stop an effect later just set a value.
setTimeout(() => {
  effect.val = null;
}, 5000);
```
