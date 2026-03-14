import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Templates de currículo disponíveis na plataforma
 */
export const templates = mysqlTable("templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  category: varchar("category", { length: 64 }),
  isActive: int("isActive").default(1).notNull(),
  config: text("config"), // JSON string com configuração do template
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Currículos criados pelos utilizadores
 */
export const resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: varchar("templateId", { length: 64 }).notNull().references(() => templates.id),
  title: text("title").notNull(),
  data: text("data").notNull(), // JSON string com todos os dados do CV
  isPublished: int("isPublished").default(0).notNull(),
  linkedinImported: int("linkedinImported").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

/**
 * Exportações de currículos (PDF/Word)
 */
export const exports = mysqlTable("exports", {
  id: int("id").autoincrement().primaryKey(),
  resumeId: int("resumeId").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  format: mysqlEnum("format", ["pdf", "word"]).notNull(),
  hasWatermark: int("hasWatermark").default(1).notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Export = typeof exports.$inferSelect;
export type InsertExport = typeof exports.$inferInsert;

/**
 * Pagamentos realizados na plataforma
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  resumeId: int("resumeId").references(() => resumes.id, { onDelete: "set null" }),
  amount: int("amount").notNull(), // Valor em cêntimos
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  method: mysqlEnum("method", ["mbway", "multibanco", "card"]).notNull(),
  orderId: varchar("orderId", { length: 255 }).unique(),
  transactionId: varchar("transactionId", { length: 255 }),
  paidAt: timestamp("paidAt"),
  metadata: text("metadata"), // JSON string com informação adicional
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Créditos de exportação dos utilizadores
 */
export const userCredits = mysqlTable("user_credits", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  credits: int("credits").default(0).notNull(), // Créditos disponíveis
  totalPurchased: int("totalPurchased").default(0).notNull(),
  totalUsed: int("totalUsed").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = typeof userCredits.$inferInsert;

/**
 * Histórico de transações de créditos
 */
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["purchase", "usage", "refund"]).notNull(),
  amount: int("amount").notNull(), // Positivo para compra/refund, negativo para uso
  balance: int("balance").notNull(), // Saldo após transação
  paymentId: int("paymentId").references(() => payments.id, { onDelete: "set null" }),
  resumeId: int("resumeId").references(() => resumes.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

/**
 * Subscrições premium dos utilizadores
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "trial"]).default("trial").notNull(),
  plan: mysqlEnum("plan", ["free", "monthly", "annual"]).default("free").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: int("cancelAtPeriodEnd").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;