import { Session } from './session.schema';
import BaseRepository from '../../repositories/BaseRepository';
import mongoose from 'mongoose';

/**
 * Session Repository using MongoDB/Mongoose
 */
class SessionRepository extends BaseRepository<any> {
  constructor() {
    super(Session);
  }

  /**
   * Find session by token
   */
  async findByToken(token: string) {
    return await this.model.findOne({ token })
      .populate('user', 'id name email role status');
  }

  /**
   * Find sessions by user ID
   */
  async findByUserId(userId: string) {
    return await this.model.find({ userId })
      .sort({ lastActive: -1 });
  }

  /**
   * Find active sessions by user ID
   */
  async findActiveByUserId(userId: string) {
    return await this.model.find({
      userId,
      expiresAt: { $gt: new Date() },
    })
    .sort({ lastActive: -1 });
  }

  /**
   * Create session
   */
  async createSession(data: {
    userId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    return await this.model.create({
      ...data,
      userId: mongoose.Types.ObjectId.createFromHexString(data.userId),
    });
  }

  /**
   * Delete session by token
   */
  async deleteByToken(token: string) {
    return await this.model.findOneAndDelete({ token });
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllForUser(userId: string) {
    return await this.model.deleteMany({ userId });
  }

  /**
   * Delete all active sessions for a user except current
   */
  async deleteOtherActiveSessions(userId: string, currentToken: string) {
    return await this.model.deleteMany({
      userId,
      token: { $ne: currentToken },
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Update session last active time
   */
  async updateLastActive(token: string) {
    return await this.model.findOneAndUpdate(
      { token },
      { lastActive: new Date() },
      { new: true }
    );
  }

  /**
   * Verify if session is valid and not expired
   */
  async verifySession(token: string) {
    const session = await this.model.findOne({ token })
      .populate('user', 'id name email role status');

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      await this.deleteByToken(token);
      return null;
    }

    // Update last active time
    await this.updateLastActive(token);

    return session;
  }

  /**
   * Delete expired sessions (handled automatically by TTL index)
   */
  async deleteExpired() {
    // TTL index handles this automatically
    return await this.model.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }

  /**
   * Get active session count for a user
   */
  async getActiveSessionCount(userId: string) {
    return await this.model.countDocuments({
      userId,
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Clean up expired sessions for all users
   */
  async cleanupExpiredSessions() {
    return await this.model.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }
}

// Create singleton instance
const sessionRepository = new SessionRepository();

// Export for backward compatibility
export { Session };
export const SessionModel = sessionRepository;

export default sessionRepository;
