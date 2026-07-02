// The only file that knows data is fake. Replace the body of `request`
// with a real fetch() and every hook above it keeps working unchanged:
//
//   export function request(resolver) {
//     return fetch('/api/...').then(r => r.json());
//   }

const LATENCY = 350;

export function request(resolver) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(resolver());
      } catch (err) {
        reject(err);
      }
    }, LATENCY);
  });
}