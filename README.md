# nanosignals
A very tiny (~0.5 KB minzipped) and experimental implementation of signals, highly inspired by [Reactively](https://github.com/milomg/reactively).

# Get started
```js
  const counter = signal(1);
  const double = signal(() => counter.val * 2);

  counter.val = 2;
  console.assert(double.val === 4);
  
  counter.val = 3;
  console.assert(double.val === 6);
```
