import bcrypt from 'bcrypt';

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Check if a password is already hashed
 * @param password - Password to check
 * @returns True if password is already hashed
 */
export const isPasswordHashed = (password: string): boolean => {
    // bcrypt hashes start with $2a$ or $2b$
    return password.startsWith('$2a$') || password.startsWith('$2b$');
};

/**
 * Hash password if it's not already hashed
 * @param password - Password to hash (plain text or already hashed)
 * @returns Hashed password or original if already hashed
 */
export const hashPasswordIfNeeded = async (password: string): Promise<string> => {
    if (!password) return password;
    if (isPasswordHashed(password)) return password;
    return await hashPassword(password);
};

/**
 * Compare plain text password with hashed password
 * @param plainPassword - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};
