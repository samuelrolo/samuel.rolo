import { eq, and, desc } from "drizzle-orm";
import { resumes, templates, exports, subscriptions } from "../drizzle/schema";
import type { InsertResume, InsertExport, InsertSubscription } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Templates
 */

export async function getAllTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(templates)
    .where(eq(templates.isActive, 1))
    .orderBy(templates.createdAt);
}

export async function getTemplateById(templateId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Currículos
 */

export async function createResume(resume: InsertResume) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(resumes).values(resume);
  return result[0].insertId;
}

export async function getUserResumes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt));
}

export async function getResumeById(resumeId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

export async function updateResume(resumeId: number, userId: number, data: Partial<InsertResume>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(resumes)
    .set(data)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));
}

export async function deleteResume(resumeId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));
}

/**
 * Exportações
 */

export async function createExport(exportData: InsertExport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(exports).values(exportData);
  return result[0].insertId;
}

export async function getUserExports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(exports)
    .where(eq(exports.userId, userId))
    .orderBy(desc(exports.createdAt));
}

/**
 * Subscrições
 */

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .insert(subscriptions)
    .values(subscription)
    .onDuplicateKeyUpdate({
      set: {
        status: subscription.status,
        plan: subscription.plan,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeCustomerId: subscription.stripeCustomerId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    });
}

export async function isUserPremium(userId: number): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) return false;
  
  // Verificar se a subscrição está ativa e não expirou
  if (subscription.status !== "active") return false;
  
  if (subscription.currentPeriodEnd) {
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    if (now > periodEnd) return false;
  }
  
  return subscription.plan === "monthly" || subscription.plan === "annual";
}
