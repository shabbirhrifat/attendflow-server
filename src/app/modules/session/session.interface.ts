/**
 * Session Module - Interface Definitions
 *
 * Manages user sessions for security and session control
 */

export interface ISessionData {
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date;
}

export interface ISessionResponse {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export interface ISessionFilter {
  userId?: string;
  active?: boolean;
  expired?: boolean;
}

export interface ICreateSessionResponse {
  success: boolean;
  message: string;
  data?: ISessionResponse;
}

export interface IGetSessionsResponse {
  success: boolean;
  message: string;
  data?: {
    sessions: ISessionResponse[];
    total: number;
    active: number;
    expired: number;
  };
}

export interface IRevokeSessionResponse {
  success: boolean;
  message: string;
}

export interface ICleanupResponse {
  success: boolean;
  message: string;
  deleted: number;
}
