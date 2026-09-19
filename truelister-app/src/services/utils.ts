/**
 * Optimized shallow equality check.
 * Faster than JSON.stringify for large state objects.
 *
 * Bolt Performance Optimization:
 * 1. Fast-path identity check (Object.is)
 * 2. Fast-path empty object check (len === 0)
 * 3. Fast-path single-property comparison (len === 1)
 * 4. Micro-optimized property lookup loop with cached hasOwnProperty reference
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

  const hasOwn = Object.prototype.hasOwnProperty;

  if (len === 1) {
    const key = keysA[0];
    return hasOwn.call(objB, key) && Object.is(objA[key], objB[key]);
  }

  for (let i = 0; i < len; i++) {
    const key = keysA[i];
    if (!hasOwn.call(objB, key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }

  return true;
}
