import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Parse connection URL
    const url = new URL(connectionString);
    
    const pool = new Pool({
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: url.username,
        password: decodeURIComponent(url.password),
        ssl: url.searchParams.get('sslmode') === 'require' ? {
            rejectUnauthorized: false,
        } : undefined,
    });

    const adapter = new PrismaPg(pool);

    const prisma = new PrismaClient({
        log: ['error', 'warn'],
        adapter,
    });

    return prisma;
};

declare global {
    // eslint-disable-next-line no-var
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
