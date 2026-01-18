/**
 * Session Module - Validation Schemas
 *
 * Zod validation schemas for session endpoints
 */

import { z } from 'zod';

// No validation needed for most session endpoints as they use params
// Export empty object for consistency
export const SessionValidation = {
  // No validations needed - all endpoints use path params or auth
};
