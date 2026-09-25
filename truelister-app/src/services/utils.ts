/**
 * Optimized shallow equality check.
 * Faster than JSON.stringify for large state objects.
 */
const hasOwn = Object.prototype.hasOwnProperty;

export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const len = keysA.length;

  if (len === 0) {
    return Object.keys(objB).length === 0;
  }

  const keysB = Object.keys(objB);
  if (len !== keysB.length) return false;

  for (let i = 0; i < len; i++) {
    const key = keysA[i];
    if (!hasOwn.call(objB, key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }

  return true;
}
