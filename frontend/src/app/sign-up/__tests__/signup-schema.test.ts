import { signupSchema } from "../signup-schema";

describe("signupSchema", () => {
  it("should accept valid signup data with age confirmed", () => {
    const result = signupSchema.safeParse({
      emailAddress: "user@example.com",
      password: "password123",
      ageConfirmed: true,
    });
    expect(result.success).toBe(true);
  });

  it("should reject when age checkbox is false", () => {
    const result = signupSchema.safeParse({
      emailAddress: "user@example.com",
      password: "password123",
      ageConfirmed: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const ageError = result.error.issues.find(
        (i) => i.path[0] === "ageConfirmed"
      );
      expect(ageError).toBeDefined();
      expect(ageError!.message).toBe(
        "You must confirm you are 16 years or older"
      );
    }
  });

  it("should reject when age checkbox is missing", () => {
    const result = signupSchema.safeParse({
      emailAddress: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const result = signupSchema.safeParse({
      emailAddress: "not-an-email",
      password: "password123",
      ageConfirmed: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(
        (i) => i.path[0] === "emailAddress"
      );
      expect(emailError).toBeDefined();
    }
  });

  it("should reject password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      emailAddress: "user@example.com",
      password: "short",
      ageConfirmed: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find(
        (i) => i.path[0] === "password"
      );
      expect(pwError).toBeDefined();
      expect(pwError!.message).toBe(
        "Password must be at least 8 characters"
      );
    }
  });

  it("should accept password with exactly 8 characters", () => {
    const result = signupSchema.safeParse({
      emailAddress: "user@example.com",
      password: "12345678",
      ageConfirmed: true,
    });
    expect(result.success).toBe(true);
  });
});
