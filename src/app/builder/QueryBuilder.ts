/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * QueryBuilder class for MongoDB/Mongoose
 * Builds complex queries with pagination, filtering, sorting, and field selection
 */
class QueryBuilder {
  public query: Record<string, unknown>;
  public filterConditions: any = {};
  public projectFields: any = undefined;
  public sortOptions: any = { createdAt: -1 };
  public paginationOptions: { skip: number; limit: number };

  constructor(query: Record<string, unknown>) {
    this.query = query;
    this.paginationOptions = {
      skip: 0,
      limit: 10,
    };
  }

  /**
   * Add search functionality across multiple fields
   * @param searchableFields - Array of field names to search in
   */
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm && searchableFields.length > 0) {
      this.filterConditions.$or = searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      }));
    }
    return this;
  }

  /**
   * Add filtering based on query parameters
   */
  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    excludeFields.forEach((field) => delete queryObj[field]);

    // Add remaining query params as filter conditions
    Object.keys(queryObj).forEach((key) => {
      this.filterConditions[key] = queryObj[key];
    });

    return this;
  }

  /**
   * Add sorting functionality
   */
  sort() {
    if (this.query.sort) {
      const sortFields = (this.query.sort as string).split(',');
      this.sortOptions = {};

      sortFields.forEach((field) => {
        if (field.startsWith('-')) {
          this.sortOptions[field.substring(1)] = -1;
        } else {
          this.sortOptions[field] = 1;
        }
      });
    }
    return this;
  }

  /**
   * Add pagination functionality
   */
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.paginationOptions = {
      skip,
      limit,
    };

    return this;
  }

  /**
   * Select specific fields (projection)
   */
  fields() {
    if (this.query.fields) {
      const fields = (this.query.fields as string).split(',');
      this.projectFields = {};

      fields.forEach((field) => {
        if (!field.startsWith('-')) {
          this.projectFields[field.trim()] = 1;
        } else {
          this.projectFields[field.substring(1).trim()] = 0;
        }
      });
    }
    return this;
  }

  /**
   * Get the Mongoose query filter object
   */
  getFilter() {
    return Object.keys(this.filterConditions).length > 0 ? this.filterConditions : {};
  }

  /**
   * Get the Mongoose sort options
   */
  getSort() {
    return this.sortOptions;
  }

  /**
   * Get pagination options
   */
  getPagination() {
    return this.paginationOptions;
  }

  /**
   * Get projection options
   */
  getProjection() {
    return this.projectFields;
  }

  /**
   * Get all query options combined
   */
  getQueryOptions() {
    return {
      filter: this.getFilter(),
      sort: this.getSort(),
      skip: this.paginationOptions.skip,
      limit: this.paginationOptions.limit,
      projection: this.projectFields,
    };
  }

  /**
   * Calculate pagination metadata
   * @param total - Total count of records
   */
  getPaginationMeta(total: number) {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
