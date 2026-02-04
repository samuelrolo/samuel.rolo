import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("payment router", () => {
  it("should have payment router registered", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.payment).toBeDefined();
  });

  it("should have createMBWay procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.payment.createMBWay).toBeDefined();
  });

  it("should have createMultibanco procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.payment.createMultibanco).toBeDefined();
  });

  it("should have checkMBWayStatus procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.payment.checkMBWayStatus).toBeDefined();
  });

  it("should have list procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.payment.list).toBeDefined();
  });

  it("should have get procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.payment.get).toBeDefined();
  });

  it("should validate MB Way phone number format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with invalid phone (should fail validation)
    await expect(
      caller.payment.createMBWay({
        phone: "123456789", // Invalid - doesn't start with 9
        amount: 2.99,
        resumeId: 1,
      })
    ).rejects.toThrow();
  });

  it("should validate Multibanco amount range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with invalid amount (should fail validation)
    await expect(
      caller.payment.createMultibanco({
        amount: 0.5, // Invalid - less than 1€
        resumeId: 1,
      })
    ).rejects.toThrow();
  });
});
