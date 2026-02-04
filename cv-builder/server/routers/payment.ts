import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createMBWayPayment,
  createMultibancoReference,
  checkMBWayPaymentStatus,
} from "../ifthenpay";
import { getDb } from "../db";
import { payments, userCredits, creditTransactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// A configuração IFTHENPay está no backend Share2Inspire
// Não precisamos de credenciais locais

export const paymentRouter = router({
  /**
   * Criar pagamento MB Way
   */
  createMBWay: protectedProcedure
    .input(
      z.object({
        phone: z.string().regex(/^9[1236]\d{7}$/, "Número de telemóvel inválido"),
        amount: z.number().min(1, "Valor mínimo é 1€"),
        resumeId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Gerar ID único para a encomenda
      const orderId = `CV-${Date.now()}-${ctx.user.id}`;

      // Criar registo de pagamento na base de dados
      await db.insert(payments).values({
        userId: ctx.user.id,
        resumeId: input.resumeId,
        amount: input.amount,
        method: "mbway",
        status: "pending",
        orderId: orderId,
      });

      // Criar pagamento MB Way
      const result = await createMBWayPayment({
        phone: input.phone,
        amount: input.amount,
        orderId: orderId,
      });

      if (result.success && result.requestId) {
        // Atualizar com requestId
        await db
          .update(payments)
          .set({ transactionId: result.requestId })
          .where(eq(payments.orderId, orderId));
      }

      return result;
    }),

  /**
   * Verificar estado de pagamento MB Way
   */
  checkMBWayStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar pagamento na base de dados
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, input.orderId))
        .limit(1);

      if (paymentRecords.length === 0) {
        return { success: false, message: "Pagamento não encontrado" };
      }

      const payment = paymentRecords[0]!;

      // Se já está pago, retornar sucesso
      if (payment.status === "completed") {
        return {
          success: true,
          status: "paid" as const,
          message: "Pagamento já confirmado",
        };
      }

      // Verificar estado na IFTHENPay
      if (!payment.transactionId) {
        return { success: false, message: "ID de transação não encontrado" };
      }

      const result = await checkMBWayPaymentStatus(payment.transactionId);

      // Atualizar estado na base de dados se foi pago
      if (result.status === "paid") {
        await db
          .update(payments)
          .set({ status: "completed", paidAt: new Date() })
          .where(eq(payments.id, payment.id));
      }

      return result;
    }),

  /**
   * Criar referência Multibanco
   */
  createMultibanco: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1, "Valor mínimo é 1€").max(999999.99, "Valor máximo é 999999.99€"),
        resumeId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Gerar ID único para a encomenda
      const orderId = `CV-${Date.now()}-${ctx.user.id}`;

      // Criar registo de pagamento na base de dados
      await db.insert(payments).values({
        userId: ctx.user.id,
        resumeId: input.resumeId,
        amount: input.amount,
        method: "multibanco",
        status: "pending",
        orderId: orderId,
      });

      // Criar referência Multibanco
      const result = await createMultibancoReference({
        amount: input.amount,
        orderId: orderId,
      });

      if (result.success && result.reference) {
        // Atualizar com referência
        await db
          .update(payments)
          .set({ transactionId: result.reference })
          .where(eq(payments.orderId, orderId));
      }

      return {
        ...result,
        orderId: orderId,
      };
    }),

  /**
   * Webhook IFTHENPay (callback de confirmação de pagamento)
   * Este endpoint recebe confirmações do backend Share2Inspire
   * O backend principal já valida os callbacks da IFTHENPay
   */
  webhook: publicProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(["completed", "failed"]),
        paidAt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        console.error("Database not available");
        return { success: false, message: "Database error" };
      }

      // Buscar pagamento
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, input.orderId))
        .limit(1);

      if (paymentRecords.length === 0) {
        console.error("Payment not found:", input.orderId);
        return { success: false, message: "Payment not found" };
      }

      const payment = paymentRecords[0]!;

      // Verificar se já foi processado
      if (payment.status === "completed") {
        return { success: true, message: "Already processed" };
      }

      // Atualizar pagamento
      await db
        .update(payments)
        .set({
          status: input.status,
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        })
        .where(eq(payments.id, payment.id));

      console.log(`Payment updated: ${input.orderId} - ${input.status}`);

      return { success: true, message: "Payment updated" };
    }),

  /**
   * Listar pagamentos do utilizador
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(payments).where(eq(payments.userId, ctx.user.id)).orderBy(payments.createdAt);
  }),

  /**
   * Obter detalhes de um pagamento
   */
  get: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const results = await db
        .select()
        .from(payments)
        .where(eq(payments.id, input.id))
        .limit(1);

      if (results.length === 0) return null;

      const payment = results[0]!;

      // Verificar se pertence ao utilizador
      if (payment.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return payment;
    }),

  /**
   * Criar pagamento (genérico para MB Way ou Multibanco)
   */
  createPayment: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
        credits: z.number().min(1),
        method: z.enum(["mbway", "multibanco"]),
        phoneNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orderId = `CV-${Date.now()}-${ctx.user.id}`;

      // Criar registo de pagamento
      await db.insert(payments).values({
        userId: ctx.user.id,
        amount: input.amount,
        method: input.method,
        status: "pending",
        orderId: orderId,
      });

      if (input.method === "mbway" && input.phoneNumber) {
        const result = await createMBWayPayment({
          phone: input.phoneNumber,
          amount: input.amount,
          orderId: orderId,
        });

        if (result.success && result.requestId) {
          await db
            .update(payments)
            .set({ transactionId: result.requestId })
            .where(eq(payments.orderId, orderId));
        }

        return { ...result, orderId };
      } else {
        const result = await createMultibancoReference({
          amount: input.amount,
          orderId: orderId,
        });

        if (result.success && result.reference) {
          await db
            .update(payments)
            .set({ transactionId: result.reference })
            .where(eq(payments.orderId, orderId));
        }

        return { ...result, orderId };
      }
    }),

  /**
   * Verificar se utilizador tem créditos disponíveis
   */
  hasCredits: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return false;

    const results = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, ctx.user.id))
      .limit(1);

    if (results.length === 0) return false;

    const credits = results[0]!;
    return credits.balance > 0;
  }),

  /**
   * Deduzir um crédito do utilizador
   */
  deductCredit: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, ctx.user.id))
      .limit(1);

    if (results.length === 0 || results[0]!.balance <= 0) {
      throw new Error("Sem créditos disponíveis");
    }

    const currentCredits = results[0]!;

    // Deduzir crédito
    await db
      .update(userCredits)
      .set({ balance: currentCredits.balance - 1 })
      .where(eq(userCredits.userId, ctx.user.id));

    // Registar transação
    await db.insert(creditTransactions).values({
      userId: ctx.user.id,
      amount: -1,
      type: "deduction",
      description: "Exportação de currículo sem marca de água",
    });

    return { success: true, remainingCredits: currentCredits.balance - 1 };
  }),
});
