/**
 * Optimized shallow equality check.
 * Faster than JSON.stringify for large state objects.
 */
/**
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Hoisted Object.prototype method
 * Local reference to hasOwnProperty avoids prototype chain lookups on every property check.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty;

export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!hasOwnProperty.call(objB, key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }
  return true;
}
