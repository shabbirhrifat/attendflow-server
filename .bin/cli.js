#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const [, , command, ...args] = process.argv;

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str) {
  return str
    .replace(/[^a-zA-Z]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

if (command === 'resource') {
  const resourceNameRaw = args[0];
  if (!resourceNameRaw) {
    console.error('❌ Please provide a resource name');
    process.exit(1);
  }

  const resourceName = toCamelCase(resourceNameRaw.toLowerCase());
  const capitalizedResourceName = capitalize(resourceName);

  const moduleDir = path.join(__dirname, '..', 'src', 'app', 'modules', resourceName);
  if (!fs.existsSync(moduleDir)) fs.mkdirSync(moduleDir, { recursive: true });

  const formatPath = (filePath) => path.relative(path.join(__dirname, '..'), filePath);

  // ---------- ROUTE ----------
  const routeContent = `
import { Router } from "express";
import { ${resourceName}Controllers } from "./${resourceName}.controller";
import validateRequest from "../../middlewares/validateRequest";
import { ${resourceName}Validation } from "./${resourceName}.validation";
import { AuthMiddleware } from "../auth/auth.middleware";

const router = Router();

// All ${resourceName} routes require authentication
router.use(AuthMiddleware.authenticate);

/** Create a new ${capitalizedResourceName} */
router.post(
  "/",
  AuthMiddleware.authorize('ADMIN'),
  validateRequest(${resourceName}Validation.create${capitalizedResourceName}Schema),
  ${resourceName}Controllers.create${capitalizedResourceName}
);

/** Get a single ${capitalizedResourceName} by ID */
router.get(
  "/:id",
  ${resourceName}Controllers.getSingle${capitalizedResourceName}
);

/** Get all ${capitalizedResourceName}s */
router.get(
  "/",
  ${resourceName}Controllers.getAll${capitalizedResourceName}
);

/** Update a ${capitalizedResourceName} by ID */
router.patch(
  "/:id",
  AuthMiddleware.authorize('ADMIN'),
  validateRequest(${resourceName}Validation.update${capitalizedResourceName}Schema),
  ${resourceName}Controllers.update${capitalizedResourceName}
);

/** Delete a ${capitalizedResourceName} by ID */
router.delete(
  "/:id",
  AuthMiddleware.authorize('ADMIN'),
  ${resourceName}Controllers.delete${capitalizedResourceName}
);

export const ${resourceName}Routes = router;
`.trim();

  // ---------- CONTROLLER ----------
  const controllerContent = `
import { Request, Response } from "express";
import { ${resourceName}Services } from "./${resourceName}.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

/** Create a new ${capitalizedResourceName} */
const create${capitalizedResourceName} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${resourceName}Services.create${capitalizedResourceName}(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "New ${capitalizedResourceName} created successfully",
    data: result,
  });
});

/** Get a single ${capitalizedResourceName} by ID */
const getSingle${capitalizedResourceName} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${resourceName}Services.get${capitalizedResourceName}ById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "${capitalizedResourceName} retrieved successfully",
    data: result,
  });
});

/** Get all ${capitalizedResourceName}s */
const getAll${capitalizedResourceName} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${resourceName}Services.getAll${capitalizedResourceName}(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "${capitalizedResourceName}s retrieved successfully",
    data: result,
  });
});

/** Update a ${capitalizedResourceName} by ID */
const update${capitalizedResourceName} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${resourceName}Services.update${capitalizedResourceName}(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "${capitalizedResourceName} updated successfully",
    data: result,
  });
});

/** Delete a ${capitalizedResourceName} by ID */
const delete${capitalizedResourceName} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${resourceName}Services.delete${capitalizedResourceName}(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "${capitalizedResourceName} deleted successfully",
    data: result,
  });
});

export const ${resourceName}Controllers = {
  create${capitalizedResourceName},
  getSingle${capitalizedResourceName},
  getAll${capitalizedResourceName},
  update${capitalizedResourceName},
  delete${capitalizedResourceName},
};
`.trim();

  // ---------- MODEL ----------
  const modelContent = `
import { Schema, model, Document } from "mongoose";
import { I${capitalizedResourceName} } from "./${resourceName}.interface";

export interface I${capitalizedResourceName}Document extends I${capitalizedResourceName}, Document {}

const ${resourceName}Schema = new Schema<I${capitalizedResourceName}Document>(
  {
    // TODO: Add schema fields here
    // Example:
    // name: { type: String, required: true },
    // description: { type: String },
    // isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const ${capitalizedResourceName}Model = model<I${capitalizedResourceName}Document>("${capitalizedResourceName}", ${resourceName}Schema);

export default ${capitalizedResourceName}Model;
`.trim();

  // ---------- INTERFACE ----------
  const interfaceContent = `
// ${capitalizedResourceName} interface
export interface I${capitalizedResourceName} {
  _id?: string;
  // TODO: Add fields here
  // Example:
  // name: string;
  // description?: string;
  // isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// For creating a new ${resourceName}
export type I${capitalizedResourceName}Create = Omit<I${capitalizedResourceName}, "_id" | "createdAt" | "updatedAt">;

// For updating a ${resourceName} (all fields optional)
export type I${capitalizedResourceName}Update = Partial<I${capitalizedResourceName}Create>;
`.trim();

  // ---------- VALIDATION ----------
  const validationContent = `
import { z } from "zod";

/** Validation schema for creating ${capitalizedResourceName} */
const create${capitalizedResourceName}Schema = z.object({
  body: z.object({
    // TODO: Add validation rules here
    // Example: name: z.string().min(1, "Name is required"),
  }),
});

/** Validation schema for updating ${capitalizedResourceName} */
const update${capitalizedResourceName}Schema = z.object({
  body: z.object({
    // TODO: Add validation rules here (all optional for updates)
  }),
});

export const ${resourceName}Validation = {
  create${capitalizedResourceName}Schema,
  update${capitalizedResourceName}Schema,
};
`.trim();

  // ---------- SERVICE ----------
  const serviceContent = `
import ${capitalizedResourceName}Model from "./${resourceName}.model";
import { I${capitalizedResourceName}Create, I${capitalizedResourceName}Update } from "./${resourceName}.interface";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/QueryBuilder";

/** Create a new ${capitalizedResourceName} */
const create${capitalizedResourceName} = async (data: I${capitalizedResourceName}Create) => {
  const result = await ${capitalizedResourceName}Model.create(data);
  return result;
};

/** Get a ${capitalizedResourceName} by ID */
const get${capitalizedResourceName}ById = async (id: string) => {
  const result = await ${capitalizedResourceName}Model.findById(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "${capitalizedResourceName} not found");
  }
  return result;
};

/** Get all ${capitalizedResourceName}s with query builder support */
const getAll${capitalizedResourceName} = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(query);

  // Build query with search, filter, sort, pagination, and field selection
  // TODO: Add searchable fields: queryBuilder.search(['name', 'description'])
  queryBuilder.filter().sort().paginate().fields();

  const filter = queryBuilder.filterConditions;
  const { skip, limit } = queryBuilder.paginationOptions;

  const [items, total] = await Promise.all([
    ${capitalizedResourceName}Model.find(filter)
      .sort(queryBuilder.sortOptions)
      .skip(skip)
      .limit(limit)
      .select(queryBuilder.projectFields),
    ${capitalizedResourceName}Model.countDocuments(filter),
  ]);

  const meta = queryBuilder.getPaginationMeta(total);

  return { data: items, meta };
};

/** Update a ${capitalizedResourceName} by ID */
const update${capitalizedResourceName} = async (id: string, data: I${capitalizedResourceName}Update) => {
  const result = await ${capitalizedResourceName}Model.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "${capitalizedResourceName} not found");
  }
  return result;
};

/** Delete a ${capitalizedResourceName} by ID */
const delete${capitalizedResourceName} = async (id: string) => {
  const result = await ${capitalizedResourceName}Model.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "${capitalizedResourceName} not found");
  }
  return result;
};

export const ${resourceName}Services = {
  create${capitalizedResourceName},
  get${capitalizedResourceName}ById,
  getAll${capitalizedResourceName},
  update${capitalizedResourceName},
  delete${capitalizedResourceName},
};
`.trim();

  // ---------- FILES ----------
  const files = {
    [path.join(moduleDir, `${resourceName}.route.ts`)]: routeContent,
    [path.join(moduleDir, `${resourceName}.controller.ts`)]: controllerContent,
    [path.join(moduleDir, `${resourceName}.model.ts`)]: modelContent,
    [path.join(moduleDir, `${resourceName}.interface.ts`)]: interfaceContent,
    [path.join(moduleDir, `${resourceName}.validation.ts`)]: validationContent,
    [path.join(moduleDir, `${resourceName}.service.ts`)]: serviceContent,
  };

  console.log(`\n${GREEN}✓${RESET} Creating ${capitalizedResourceName} module with Mongoose...\n`);

  for (const [filePath, content] of Object.entries(files)) {
    fs.writeFileSync(filePath, content);
    console.log(
      `${GREEN}CREATE ${RESET}${formatPath(filePath)} ${BLUE}(${Buffer.byteLength(
        content,
        'utf8'
      )} bytes)${RESET}`
    );
  }

  console.log(`\n${YELLOW}⚠ Don't forget to:${RESET}`);
  console.log(`  1. Define the Mongoose schema fields in ${resourceName}.model.ts`);
  console.log(`  2. Define the interface fields in ${resourceName}.interface.ts`);
  console.log(`  3. Add validation rules in ${resourceName}.validation.ts`);
  console.log(`  4. Add the route to src/app/routes/index.ts\n`);
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
