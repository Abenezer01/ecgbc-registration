import { Request } from "express";
import prisma from "../../config/db.config";

export interface ActivityLogData {
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, any>;
  performedBy?: string;
  performedByType?: "STAFF" | "CHURCH_USER";
}

/**
 * Log an activity to the database
 */
export async function logActivity(
  data: ActivityLogData,
  req?: Request
): Promise<void> {
  try {
    const reqAny = req as any;
    
    // Extract performer information from request if available
    let performedBy = data.performedBy;
    let performedByType = data.performedByType;

    if (!performedBy && reqAny) {
      // Check for staff user
      if (reqAny.staff) {
        performedBy = reqAny.staff.id;
        performedByType = "STAFF";
      }
      // Check for church user
      else if (reqAny.churchUser) {
        performedBy = reqAny.churchUser.id;
        performedByType = "CHURCH_USER";
      }
    }

    // Extract IP and user agent from request
    const ipAddress = req?.ip || req?.connection.remoteAddress || null;
    const userAgent = req?.get("user-agent") || null;

    await prisma.activity.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        performedBy,
        performedByType,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log errors but don't throw to avoid breaking main operations
    console.error("Failed to log activity:", error);
  }
}

/**
 * Activity action types
 */
export const ActivityAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  VIEW: "VIEW",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  EXPORT: "EXPORT",
  UPLOAD: "UPLOAD",
  DOWNLOAD: "DOWNLOAD",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

/**
 * Activity entity types
 */
export const ActivityEntity = {
  MEMBER: "MEMBER",
  REPORT: "REPORT",
  DATA_LOOKUP: "DATA_LOOKUP",
  CHURCH_USER: "CHURCH_USER",
  STAFF: "STAFF",
  FILE: "FILE",
  BOARD_MEMBER: "BOARD_MEMBER",
  COUNCIL_FELLOWSHIP: "COUNCIL_FELLOWSHIP",
  REPORTING_FEE: "REPORTING_FEE",
  FEE_RULE: "FEE_RULE",
  REPORT_REQUEST: "REPORT_REQUEST",
  CATEGORY_FEE_RATE: "CATEGORY_FEE_RATE",
  PAYMENT_METHOD_CONFIG: "PAYMENT_METHOD_CONFIG",
} as const;
