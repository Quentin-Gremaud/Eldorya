import { signinSchema } from "../signin-schema";

describe("signinSchema", () => {
  it("should accept valid email and password", () => {
    const result = signinSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const result = signinSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(
        (i) => i.path[0] === "email"
      );
      expect(emailError).toBeDefined();
      expect(emailError!.message).toBe("Please enter a valid email address");
    }
  });

  it("should reject password shorter than 8 characters", () => {
    const result = signinSchema.safeParse({
      email: "user@example.com",
      password: "short",
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

  it("should reject empty fields", () => {
    const result = signinSchema.safeParse({
      email: "",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("should accept password with exactly 8 characters", () => {
    const result = signinSchema.safeParse({
      email: "user@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });
});
