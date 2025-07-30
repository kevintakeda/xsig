

# xsig
![NPM Downloads](https://img.shields.io/npm/dm/xsig)
![NPM License](https://img.shields.io/npm/l/xsig)

A very tiny reactive library, highly inspired by [Reactively](https://github.com/milomg/reactively).

- Signals-based observers
- Only **469 bytes** (minified and brotlied)
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
import { signal, computed, effect } from "xsig";

// A "data source".
const number = signal(1);

// A "computed" that executes only when `double.value` is read.
const double = computed(() => number.value * 2);

// An "effect" that executes only if `double` changes.
const dispose = effect(() => {
  console.log("double is: " + double.value);
  return () => {
    /* clean up code if needed */
  };
});

// does nothing yet
number.value = 0;
number.value = 2;

// To stop an effect later just set a value.
setTimeout(() => {
  dispose();
}, 5000);

// At end it logs "double is: 4".
```
