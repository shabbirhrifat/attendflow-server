import { RefreshToken, PasswordResetToken, EmailVerificationToken } from './auth.schema';
import BaseRepository from '../../repositories/BaseRepository';
import mongoose from 'mongoose';

/**
 * Refresh Token Repository using MongoDB/Mongoose
 */
class RefreshTokenRepository extends BaseRepository<any> {
  constructor() {
    super(RefreshToken);
  }

  /**
   * Find refresh token by token string
   */
  async findByToken(token: string) {
    return await this.model.findOne({ token })
      .populate('user', 'id name email role status');
  }

  /**
   * Find refresh tokens by user ID
   */
  async findByUserId(userId: string) {
    return await this.model.find({ userId })
      .sort({ createdAt: -1 });
  }

  /**
   * Delete refresh token by token string
   */
  async deleteByToken(token: string) {
    return await this.model.findOneAndDelete({ token });
  }

  /**
   * Delete all refresh tokens for a user
   */
  async deleteAllForUser(userId: string) {
    return await this.model.deleteMany({ userId });
  }

  /**
   * Delete expired tokens (handled automatically by TTL index)
   */
  async deleteExpired() {
    // TTL index handles this automatically
    return await this.model.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }

  /**
   * Create refresh token
   */
  async createToken(userId: string, token: string, expiresAt: Date) {
    return await this.model.create({
      userId,
      token,
      expiresAt,
    });
  }

  /**
   * Verify if token is valid and not expired
   */
  async verifyToken(token: string) {
    const tokenDoc = await this.model.findOne({ token })
      .populate('user', 'id name email role status');

    if (!tokenDoc) {
      return null;
    }

    if (tokenDoc.expiresAt < new Date()) {
      await this.deleteByToken(token);
      return null;
    }

    return tokenDoc;
  }
}

/**
 * Password Reset Token Repository using MongoDB/Mongoose
 */
class PasswordResetTokenRepository extends BaseRepository<any> {
  constructor() {
    super(PasswordResetToken);
  }

  /**
   * Find password reset token by token string
   */
  async findByToken(token: string) {
    return await this.model.findOne({ token })
      .populate('user', 'id name email');
  }

  /**
   * Create password reset token
   */
  async createToken(userId: string, token: string, expiresIn: number = 3600000) {
    const expiresAt = new Date(Date.now() + expiresIn);

    // Delete any existing tokens for this user
    await this.model.deleteMany({ userId });

    return await this.model.create({
      userId,
      token,
      expiresAt,
    });
  }

  /**
   * Delete password reset token by token string
   */
  async deleteByToken(token: string) {
    return await this.model.findOneAndDelete({ token });
  }

  /**
   * Delete all password reset tokens for a user
   */
  async deleteAllForUser(userId: string) {
    return await this.model.deleteMany({ userId });
  }

  /**
   * Verify if token is valid and not expired
   */
  async verifyToken(token: string) {
    const tokenDoc = await this.model.findOne({ token })
      .populate('user', 'id name email');

    if (!tokenDoc) {
      return null;
    }

    if (tokenDoc.expiresAt < new Date()) {
      await this.deleteByToken(token);
      return null;
    }

    return tokenDoc;
  }

  /**
   * Delete expired tokens
   */
  async deleteExpired() {
    return await this.model.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }
}

/**
 * Email Verification Token Repository using MongoDB/Mongoose
 */
class EmailVerificationTokenRepository extends BaseRepository<any> {
  constructor() {
    super(EmailVerificationToken);
  }

  /**
   * Find email verification token by token string
   */
  async findByToken(token: string) {
    return await this.model.findOne({ token })
      .populate('user', 'id name email');
  }

  /**
   * Create email verification token
   */
  async createToken(userId: string, token: string, expiresIn: number = 86400000) {
    const expiresAt = new Date(Date.now() + expiresIn);

    // Delete any existing tokens for this user
    await this.model.deleteMany({ userId });

    return await this.model.create({
      userId,
      token,
      expiresAt,
    });
  }

  /**
   * Delete email verification token by token string
   */
  async deleteByToken(token: string) {
    return await this.model.findOneAndDelete({ token });
  }

  /**
   * Delete all email verification tokens for a user
   */
  async deleteAllForUser(userId: string) {
    return await this.model.deleteMany({ userId });
  }

  /**
   * Verify if token is valid and not expired
   */
  async verifyToken(token: string) {
    const tokenDoc = await this.model.findOne({ token })
      .populate('user', 'id name email');

    if (!tokenDoc) {
      return null;
    }

    if (tokenDoc.expiresAt < new Date()) {
      await this.deleteByToken(token);
      return null;
    }

    return tokenDoc;
  }

  /**
   * Delete expired tokens
   */
  async deleteExpired() {
    return await this.model.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }
}

// Create singleton instances
const refreshTokenRepository = new RefreshTokenRepository();
const passwordResetTokenRepository = new PasswordResetTokenRepository();
const emailVerificationTokenRepository = new EmailVerificationTokenRepository();

// Export for backward compatibility
export { RefreshToken, PasswordResetToken, EmailVerificationToken };
export const RefreshTokenModel = refreshTokenRepository;
export const PasswordResetTokenModel = passwordResetTokenRepository;
export const EmailVerificationTokenModel = emailVerificationTokenRepository;

export default refreshTokenRepository;
