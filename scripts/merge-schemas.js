const fs = require('fs');
const path = require('path');

const prismaDir = path.join(__dirname, '..', 'prisma');
const outputFile = path.join(prismaDir, 'schema.prisma');

// List of schema files in order (excluding the base)
const schemaFiles = [
    'user.prisma',
    'organization.prisma',
    'attendance.prisma',
    'leave.prisma',
    'notification.prisma',
    'auth.prisma',
    'audit.prisma',
    'session.prisma',
];

// Read base schema (contains datasource, generator, enums)
const baseSchema = fs.readFileSync(path.join(prismaDir, 'schema.base.prisma'), 'utf-8');

// Read other schema files (only models)
const additionalSchemas = schemaFiles.map(file => {
    const filePath = path.join(prismaDir, file);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
}).filter(content => content.length > 0);

// Combine all schemas
const combinedSchema = [baseSchema, ...additionalSchemas].join('\n\n');

// Write the combined schema
fs.writeFileSync(outputFile, combinedSchema, 'utf-8');

console.log('✅ Schema files merged successfully!');
console.log(`📝 Output: ${outputFile}`);
console.log(`📦 Merged ${schemaFiles.length + 1} files (1 base + ${schemaFiles.length} modules)`);
