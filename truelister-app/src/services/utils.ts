const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Optimized shallow equality check.
 * Faster than JSON.stringify for large state objects.
 *
 * Bolt Performance Optimizations:
 * 1. Hoisted `hasOwn` reference to eliminate prototype lookup on Object.prototype during loop passes.
 * 2. Cached `keysA.length` in `len` with fast-path `len === 0` exit for empty object comparisons.
 * 3. Cached property key `const key = keysA[i]` to eliminate double array indexing per iteration.
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  const len = keysA.length;
  if (len !== keysB.length) return false;
  if (len === 0) return true;

  for (let i = 0; i < len; i++) {
    const key = keysA[i];
    if (!hasOwn.call(objB, key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }
  return true;
}
