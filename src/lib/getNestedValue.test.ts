import { describe, it, expect } from "vitest";
import { getNestedValue } from "./getNestedValue";

describe("getNestedValue", () => {
  it("returns nested object at given path", () => {
    const obj = { a: { b: { c: "value" } } };
    const result = getNestedValue(obj, ["a", "b"]);
    expect(result).toEqual({ c: "value" });
  });

  it("returns undefined when path key is missing", () => {
    const obj = { a: { b: 1 } };
    const result = getNestedValue(obj, ["a", "missing"]);
    expect(result).toBeUndefined();
  });

  it("returns undefined when intermediate value is null", () => {
    const obj = { a: null };
    const result = getNestedValue(obj, ["a", "b"]);
    expect(result).toBeUndefined();
  });

  it("returns undefined when intermediate value is not an object", () => {
    const obj = { a: 42 };
    const result = getNestedValue(obj, ["a", "b"]);
    expect(result).toBeUndefined();
  });

  it("returns undefined when leaf value is not an object", () => {
    const obj = { a: { b: "string" } };
    const result = getNestedValue(obj, ["a", "b"]);
    expect(result).toBeUndefined();
  });

  it("handles empty path by returning undefined for non-object root", () => {
    const result = getNestedValue("not-an-object", []);
    expect(result).toBeUndefined();
  });
});
