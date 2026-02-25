import mongoose, { Model, Document, UpdateQuery, ClientSession, Types } from 'mongoose';

/**
 * Generic BaseRepository for MongoDB/Mongoose
 * Provides common CRUD operations for all models
 */

// Type alias for filter queries
export type FilterQuery<T> = {
  [P in keyof T]?: T[P] | RegExp | Types.ObjectId | any;
} & {
  _id?: Types.ObjectId | string;
  [key: string]: any;
};

export interface PaginationOptions {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface QueryOptions {
  sort?: Record<string, 1 | -1 | 'asc' | 'desc'>;
  populate?: string | string[] | Record<string, unknown>;
  lean?: boolean;
}

export interface FindManyOptions extends PaginationOptions, QueryOptions {
  filter?: any;
}

export interface FindManyResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class BaseRepository<T extends Document> {
  public model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const document = new this.model(data);
    if (session) {
      return await document.save({ session }) as T;
    }
    return await document.save() as T;
  }

  /**
   * Create multiple documents
   */
  async createMany(data: Partial<T>[], session?: ClientSession): Promise<T[]> {
    if (session) {
      return await this.model.insertMany(data, { session }) as unknown as T[];
    }
    return await this.model.insertMany(data) as unknown as T[];
  }

  /**
   * Find a document by ID
   */
  async findById(
    id: string,
    options: QueryOptions = {},
    session?: ClientSession
  ): Promise<T | null> {
    let query: any = this.model.findById(id);

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.lean) {
      query = query.lean();
    }

    if (session) {
      query = query.session(session);
    }

    return await query.exec();
  }

  /**
   * Find one document by filter
   */
  async findOne(
    filter: any,
    options: QueryOptions = {},
    session?: ClientSession
  ): Promise<T | null> {
    let query: any = this.model.findOne(filter);

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.lean) {
      query = query.lean();
    }

    if (session) {
      query = query.session(session);
    }

    return await query.exec();
  }

  /**
   * Find many documents with pagination
   */
  async findMany(
    options: FindManyOptions = {}
  ): Promise<FindManyResult<T>> {
    const {
      filter = {},
      page = 1,
      limit = 10,
      sort = { createdAt: -1 as const },
      populate,
      lean = true,
    } = options;

    const skip = ((page as number) - 1) * (limit as number);

    let query: any = this.model.find(filter);

    if (sort) {
      query = query.sort(sort);
    }

    if (populate) {
      query = query.populate(populate);
    }

    if (lean) {
      query = query.lean();
    }

    query = query.skip(skip).limit(limit as number);

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data: data as T[],
      meta: {
        total,
        page: page as number,
        limit: limit as number,
        totalPages: Math.ceil(total / (limit as number)),
      },
    };
  }

  /**
   * Update a document by ID
   */
  async update(
    id: string,
    data: UpdateQuery<T> | Partial<T>,
    options: QueryOptions = {},
    session?: ClientSession
  ): Promise<T | null> {
    let query: any = this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.lean) {
      query = query.lean();
    }

    if (session) {
      query = query.session(session);
    }

    return await query.exec();
  }

  /**
   * Update one document by filter
   */
  async updateOne(
    filter: any,
    data: UpdateQuery<T> | Partial<T>,
    options: QueryOptions = {},
    session?: ClientSession
  ): Promise<T | null> {
    let query: any = this.model.findOneAndUpdate(filter, data, {
      new: true,
      runValidators: true,
    });

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.lean) {
      query = query.lean();
    }

    if (session) {
      query = query.session(session);
    }

    return await query.exec();
  }

  /**
   * Update many documents by filter
   */
  async updateMany(
    filter: FilterQuery<T>,
    data: UpdateQuery<T> | Partial<T>,
    session?: ClientSession
  ): Promise<{ modifiedCount: number }> {
    const result = session
      ? await this.model.updateMany(filter, data, { session })
      : await this.model.updateMany(filter, data);

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string, session?: ClientSession): Promise<T | null> {
    const query = this.model.findByIdAndDelete(id);

    if (session) {
      query.session(session);
    }

    return await query.exec();
  }

  /**
   * Delete one document by filter
   */
  async deleteOne(
    filter: any,
    session?: ClientSession
  ): Promise<T | null> {
    let query: any = this.model.findOneAndDelete(filter);

    if (session) {
      query = query.session(session);
    }

    return await query.exec();
  }

  /**
   * Delete many documents by filter
   */
  async deleteMany(
    filter: any,
    session?: ClientSession
  ): Promise<{ deletedCount: number }> {
    const result = session
      ? await this.model.deleteMany(filter, { session })
      : await this.model.deleteMany(filter);

    return { deletedCount: result.deletedCount };
  }

  /**
   * Count documents by filter
   */
  async count(filter: any = {}): Promise<number> {
    return await this.model.countDocuments(filter);
  }

  /**
   * Check if any document exists matching the filter
   */
  async exists(filter: any): Promise<boolean> {
    return await this.model.exists(filter) !== null;
  }

  /**
   * Aggregate pipeline
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline).exec();
  }

  /**
   * Start a MongoDB session for transactions
   */
  async startSession(): Promise<ClientSession> {
    const session = await this.model.db.startSession();
    session.startTransaction();
    return session;
  }

  /**
   * Execute a function within a transaction
   */
  async withTransaction<T>(
    fn: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await this.startSession();

    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default BaseRepository;
