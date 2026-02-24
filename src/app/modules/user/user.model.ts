import { User } from './user.schema';
import BaseRepository from '../../repositories/BaseRepository';
import mongoose from 'mongoose';

/**
 * User Repository using MongoDB/Mongoose
 * Extends BaseRepository for common CRUD operations
 */

class UserRepository extends BaseRepository<any> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return await this.model.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string) {
    return await this.model.findOne({ username });
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(identifier: string) {
    return await this.model.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    });
  }

  /**
   * Get users by role
   */
  async findByRole(role: string) {
    return await this.model.find({ role });
  }

  /**
   * Get users by status
   */
  async findByStatus(status: string) {
    return await this.model.find({ status });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, hashedPassword: string) {
    return await this.model.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );
  }

  /**
   * Get user count by role
   */
  async countByRole(role: string) {
    return await this.model.countDocuments({ role });
  }

  /**
   * Get user count by status
   */
  async countByStatus(status: string) {
    return await this.model.countDocuments({ status });
  }

  /**
   * Search users by name or email
   */
  async search(searchTerm: string) {
    return await this.model.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
      ],
    });
  }

  /**
   * Get user with populated relations
   */
  async findByIdWithRelations(id: string, relations: string[] = []) {
    const query = this.model.findById(id);
    relations.forEach((relation) => query.populate(relation));
    return await query.exec();
  }

  /**
   * Soft delete user (set status to INACTIVE)
   */
  async softDelete(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { status: 'INACTIVE' },
      { new: true }
    );
  }

  /**
   * Update last login (if you add this field)
   */
  async updateLastLogin(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { lastLoginAt: new Date() },
      { new: true }
    );
  }
}

// Create singleton instance
const userRepository = new UserRepository();

// Export both the model and repository for backward compatibility
export { User };
export const UserModel = userRepository;
export default userRepository;