import { describe, it, expect } from 'vitest';
import { formatTimingValue } from './columns';

describe('formatTimingValue', () => {
  const defaultDecimals = {
    "setup(r2r)": 3,
    "hold(r2r)": 3,
    "clock_mttv": 3,
    "data_mttv": 3,
    "max_cap": 3,
    "cpc": 3,
    "gnoise": 3
  };

  it('formats with per-group decimal: setup(r2r) at 3 decimals', () => {
    const result = formatTimingValue(1.23456, { "setup(r2r)": 3 }, "setup(r2r)", false);
    expect(result).toBe("1.235");
  });

  it('formats with per-group decimal: hold(r2r) at 5 decimals', () => {
    const result = formatTimingValue(1.23456, { "hold(r2r)": 5 }, "hold(r2r)", false);
    expect(result).toBe("1.23456");
  });

  it('formats with per-group decimal: clock_mttv at 0 decimals', () => {
    const result = formatTimingValue(1.9, { "clock_mttv": 0 }, "clock_mttv", false);
    expect(result).toBe("2");
  });

  it('falls back to default 3 decimals if group missing from map', () => {
    const result = formatTimingValue(1.23456, {}, "setup(r2r)", false);
    expect(result).toBe("1.235");
  });

  it('NVP always returns integer regardless of decimal setting', () => {
    const result = formatTimingValue(42.789, { "setup(r2r)": 5 }, "setup(r2r)", true);
    expect(result).toBe("42");
  });

  it('zero always returns "0" regardless of decimal setting', () => {
    const result = formatTimingValue(0, { "setup(r2r)": 5 }, "setup(r2r)", false);
    expect(result).toBe("0");
  });

  it('handles null/undefined/empty string gracefully', () => {
    expect(formatTimingValue(null, defaultDecimals, "setup(r2r)", false)).toBe("-");
    expect(formatTimingValue(undefined, defaultDecimals, "setup(r2r)", false)).toBe("-");
    expect(formatTimingValue("", defaultDecimals, "setup(r2r)", false)).toBe("-");
  });

  it('handles loading placeholder', () => {
    expect(formatTimingValue("___LOADING___", defaultDecimals, "setup(r2r)", false)).toBe("-");
  });

  it('handles non-numeric strings', () => {
    expect(formatTimingValue("invalid", defaultDecimals, "setup(r2r)", false)).toBe("invalid");
  });
});
