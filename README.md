# nanosignals

A very tiny (~0.5 KB minified+brotli) and experimental implementation of signals, highly inspired by [Reactively](https://github.com/milomg/reactively).

## Example

```js
import { signal, tick } from "nanosignals";

const counter = signal(1);
const double = signal(() => counter.val * 2);

counter.val = 2; // updates the counter but nothing else
console.log(double.val); // compute and logs 4
console.log(double.val); // logs 4 immediately from the cache

signal(() => console.log(double.val), { effect: true }); // a lazy effect
counter.val = 3; // updates the counter

tick(); // logs 6
tick(); // does nothing.

double.val; // returns 6 immediately from the cache
```
