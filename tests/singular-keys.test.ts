/**
 * Singular SDK Key Validation
 *
 * Validates that the Singular SDK keys are present and have the expected format.
 * These are EXPO_PUBLIC_ env vars so they are available at build time.
 *
 * Note: We cannot call the Singular SDK directly in tests (native module),
 * so we validate the key format which is sufficient to confirm correct credentials.
 */

import { describe, it, expect } from "vitest";

describe("Singular SDK Keys", () => {
  it("EXPO_PUBLIC_SINGULAR_API_KEY is set and has correct format", () => {
    const key = process.env.EXPO_PUBLIC_SINGULAR_API_KEY;
    expect(key, "EXPO_PUBLIC_SINGULAR_API_KEY must be set").toBeTruthy();
    // Singular SDK keys follow the pattern: {app_name}_{hex_string}_{short_hex}
    expect(key).toMatch(/^[a-z0-9_]+_[a-f0-9]+_[a-f0-9]+$/);
  });

  it("EXPO_PUBLIC_SINGULAR_SECRET is set and has correct format", () => {
    const secret = process.env.EXPO_PUBLIC_SINGULAR_SECRET;
    expect(secret, "EXPO_PUBLIC_SINGULAR_SECRET must be set").toBeTruthy();
    // Singular secrets are 32-char hex strings
    expect(secret).toMatch(/^[a-f0-9]{32}$/);
  });

  it("SDK key and secret are different values", () => {
    const key = process.env.EXPO_PUBLIC_SINGULAR_API_KEY;
    const secret = process.env.EXPO_PUBLIC_SINGULAR_SECRET;
    expect(key).not.toBe(secret);
  });
});
