import { db } from "@/db";
import {
  approvalRequests,
  approvalRules,
  approvalSteps,
  approvalActions,
} from "@/db/schema/approvals";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export class ApprovalService {
  /**
   * Check if approval is required and initiate the process if so.
   * Returns validation status.
   */
  static async requestApproval(params: {
    companyId: string;
    documentType: string;
    documentId: string;
    documentNumber: string;
    requestedBy: string;
    amount?: number; // For amount-based rules
  }) {
    const { companyId, documentType, documentId, documentNumber, requestedBy, amount } = params;

    // 1. Find applicable rules
    // For now, simple logic: Find active rule for doc type, optionally check amount
    const rules = await db.query.approvalRules.findMany({
      where: and(
        eq(approvalRules.companyId, companyId),
        eq(approvalRules.documentType, documentType),
        eq(approvalRules.isActive, true)
      ),
      orderBy: [desc(approvalRules.priority)],
      with: {
        steps: true,
      },
    });

    let matchedRule = null;

    for (const rule of rules) {
      if (rule.ruleType === "ALWAYS") {
        matchedRule = rule;
        break;
      }
      if (rule.ruleType === "AMOUNT_THRESHOLD" && amount !== undefined) {
        if (
          (rule.minAmount === null || amount >= rule.minAmount) &&
          (rule.maxAmount === null || amount <= rule.maxAmount)
        ) {
          matchedRule = rule;
          break;
        }
      }
    }

    if (!matchedRule) {
      return { required: false, status: "auto_approved" };
    }

    // 2. Create Approval Request
    const [request] = await db
      .insert(approvalRequests)
      .values({
        companyId,
        documentType,
        documentId,
        documentNumber,
        ruleId: matchedRule.id,
        currentStep: 1,
        status: "PENDING",
        requestedBy,
      })
      .returning();

    return { required: true, status: "pending_approval", requestId: request.id };
  }

  /**
   * Approve a pending request
   */
  static async approve(params: {
    requestId: string;
    userId: string;
    comment?: string;
  }) {
    const { requestId, userId, comment } = params;

    const request = await db.query.approvalRequests.findFirst({
      where: eq(approvalRequests.id, requestId),
      with: {
        rule: {
          with: {
            steps: true,
          },
        },
      },
    });

    if (!request || !request.rule) {
      throw new Error("Approval request not found");
    }

    if (request.status !== "PENDING") {
      throw new Error("Request is not pending approval");
    }

    const currentStepIndex = request.currentStep ? request.currentStep - 1 : 0;
    const currentStepConfig = request.rule.steps.find((s) => s.stepOrder === request.currentStep);
    
    // In a real app, strict check: currentStepConfig.approverId === userId OR User has role
    // For now, we log the action and proceed.

    // Log Action
    await db.insert(approvalActions).values({
      requestId,
      stepId: currentStepConfig?.id,
      actionBy: userId,
      action: "APPROVE",
      comments: comment,
    });

    // Check if there is a next step
    const nextStep = request.rule.steps.find((s) => s.stepOrder === (request.currentStep || 0) + 1);

    if (nextStep) {
      // Move to next step
      await db
        .update(approvalRequests)
        .set({ currentStep: (request.currentStep || 0) + 1 })
        .where(eq(approvalRequests.id, requestId));
      
      return { status: "PENDING", nextStep: nextStep.stepOrder };
    } else {
      // Final Approval
      await db
        .update(approvalRequests)
        .set({ status: "APPROVED", completedAt: new Date() })
        .where(eq(approvalRequests.id, requestId));
      
      return { status: "APPROVED" };
    }
  }

  /**
   * Reject a request
   */
  static async reject(params: {
    requestId: string;
    userId: string;
    comment?: string;
  }) {
    const { requestId, userId, comment } = params;

    const request = await db.query.approvalRequests.findFirst({
      where: eq(approvalRequests.id, requestId),
    });

    if (!request) {
      throw new Error("Approval request not found");
    }

    // Log Action
    await db.insert(approvalActions).values({
      requestId,
      actionBy: userId,
      action: "REJECT",
      comments: comment,
    });

    // Mark as Rejected
    await db
      .update(approvalRequests)
      .set({ status: "REJECTED", completedAt: new Date() })
      .where(eq(approvalRequests.id, requestId));

    return { status: "REJECTED" };
  }
}
