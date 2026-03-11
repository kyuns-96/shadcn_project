/**
 * Traverses a nested object structure following the given path array.
 * Returns the value at the path if it is a non-null object, otherwise undefined.
 *
 * @param obj - The root object to traverse
 * @param path - Array of keys representing the path to traverse
 * @returns The nested object at the path, or undefined if not found
 */
export const getNestedValue = (
  obj: unknown,
  path: string[]
): Record<string, unknown> | undefined => {
  let current = obj;

  for (const key of path) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  if (typeof current === "object" && current !== null) {
    return current as Record<string, unknown>;
  }

  return undefined;
};
