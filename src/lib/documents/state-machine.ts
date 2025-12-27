/**
 * Document State Machine
 * 
 * Manages document lifecycle states with validation rules and transition audit.
 * Follows the blueprint's "No Delete" policy - only state transitions allowed.
 */

export type DocumentState = 
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export interface StateTransition {
  from: DocumentState;
  to: DocumentState;
  allowedRoles: string[];
  requiresApproval: boolean;
  requiresReason: boolean;
}

// Define allowed state transitions
const STATE_TRANSITIONS: StateTransition[] = [
  // From Draft
  { from: "draft", to: "pending", allowedRoles: ["user", "manager", "admin"], requiresApproval: false, requiresReason: false },
  { from: "draft", to: "cancelled", allowedRoles: ["user", "manager", "admin"], requiresApproval: false, requiresReason: true },
  
  // From Pending
  { from: "pending", to: "approved", allowedRoles: ["manager", "admin"], requiresApproval: true, requiresReason: false },
  { from: "pending", to: "rejected", allowedRoles: ["manager", "admin"], requiresApproval: true, requiresReason: true },
  { from: "pending", to: "draft", allowedRoles: ["user", "manager", "admin"], requiresApproval: false, requiresReason: true }, // Revise
  
  // From Approved
  { from: "approved", to: "completed", allowedRoles: ["user", "manager", "admin"], requiresApproval: false, requiresReason: false },
  { from: "approved", to: "cancelled", allowedRoles: ["manager", "admin"], requiresApproval: true, requiresReason: true }, // Requires reversal
  
  // From Rejected
  { from: "rejected", to: "draft", allowedRoles: ["user", "manager", "admin"], requiresApproval: false, requiresReason: false }, // Revise and resubmit
  
  // From Completed - Only cancel allowed (with reversal)
  { from: "completed", to: "cancelled", allowedRoles: ["admin"], requiresApproval: true, requiresReason: true },
];

export interface TransitionResult {
  success: boolean;
  error?: string;
  newState?: DocumentState;
  requiresReversal?: boolean;
}

/**
 * Check if a state transition is allowed
 */
export function canTransition(
  currentState: DocumentState,
  targetState: DocumentState,
  userRole: string
): TransitionResult {
  // Find matching transition rule
  const transition = STATE_TRANSITIONS.find(
    (t) => t.from === currentState && t.to === targetState
  );

  if (!transition) {
    return {
      success: false,
      error: `Transition from ${currentState} to ${targetState} is not allowed`,
    };
  }

  // Check role permission
  if (!transition.allowedRoles.includes(userRole)) {
    return {
      success: false,
      error: `Role '${userRole}' cannot perform this transition`,
    };
  }

  // Check if this transition requires reversal (cancel from approved/completed)
  const requiresReversal = 
    targetState === "cancelled" && 
    (currentState === "approved" || currentState === "completed");

  return {
    success: true,
    newState: targetState,
    requiresReversal,
  };
}

/**
 * Get available transitions for current state and role
 */
export function getAvailableTransitions(
  currentState: DocumentState,
  userRole: string
): DocumentState[] {
  return STATE_TRANSITIONS
    .filter((t) => t.from === currentState && t.allowedRoles.includes(userRole))
    .map((t) => t.to);
}

/**
 * Check if transition requires a reason
 */
export function requiresReason(
  currentState: DocumentState,
  targetState: DocumentState
): boolean {
  const transition = STATE_TRANSITIONS.find(
    (t) => t.from === currentState && t.to === targetState
  );
  return transition?.requiresReason ?? false;
}

/**
 * Check if transition requires approval
 */
export function requiresApproval(
  currentState: DocumentState,
  targetState: DocumentState
): boolean {
  const transition = STATE_TRANSITIONS.find(
    (t) => t.from === currentState && t.to === targetState
  );
  return transition?.requiresApproval ?? false;
}

/**
 * State display info
 */
export const STATE_INFO: Record<DocumentState, { label: string; labelAr: string; color: string }> = {
  draft: { label: "Draft", labelAr: "مسودة", color: "gray" },
  pending: { label: "Pending Approval", labelAr: "في انتظار الموافقة", color: "yellow" },
  approved: { label: "Approved", labelAr: "معتمد", color: "green" },
  rejected: { label: "Rejected", labelAr: "مرفوض", color: "red" },
  cancelled: { label: "Cancelled", labelAr: "ملغى", color: "red" },
  completed: { label: "Completed", labelAr: "مكتمل", color: "blue" },
};
