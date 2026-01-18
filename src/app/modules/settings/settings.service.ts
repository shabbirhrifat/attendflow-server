import prisma from "../../config/prisma";
import { ISettingUpdate, DEFAULT_SETTINGS, SETTINGS_VALIDATION } from "./settings.interface";
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

/**
 * Initialize default settings if they don't exist
 */
const initializeDefaultSettings = async () => {
    const existingKeys = await prisma.setting.findMany({
        select: { key: true }
    });

    const existingKeySet = new Set(existingKeys.map(s => s.key));
    const missingSettings = Object.entries(DEFAULT_SETTINGS).filter(
        ([key]) => !existingKeySet.has(key)
    );

    if (missingSettings.length > 0) {
        // Group settings by their group (extract from key prefix)
        const createPromises = missingSettings.map(([key, value]) => {
            const group = key.split('.')[0].toUpperCase();
            return prisma.setting.create({
                data: {
                    key,
                    value,
                    group,
                }
            });
        });

        await prisma.$transaction(createPromises);
    }
};

/**
 * Get all settings, optionally filtered by group
 */
const getSettings = async (group?: string) => {
    // Ensure default settings exist
    await initializeDefaultSettings();

    const where = group ? { group } : {};
    const settings = await prisma.setting.findMany({ where });

    // Transform to key-value object
    return settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, any>);
};

/**
 * Get settings organized by category
 */
const getSettingsByCategory = async () => {
    await initializeDefaultSettings();

    const settings = await prisma.setting.findMany();
    const grouped = settings.reduce((acc, curr) => {
        const category = curr.key.split('.')[0];
        if (!acc[category]) {
            acc[category] = {};
        }
        acc[category][curr.key.replace(`${category}.`, '')] = curr.value;
        return acc;
    }, {} as Record<string, any>);

    return grouped;
};

/**
 * Get a single setting by key
 */
const getSetting = async (key: string) => {
    await initializeDefaultSettings();

    const setting = await prisma.setting.findUnique({
        where: { key }
    });

    if (!setting) {
        return DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] || null;
    }

    return setting.value;
};

/**
 * Update or create a setting with validation
 */
const updateSetting = async (payload: ISettingUpdate) => {
    // Validate setting if validation rule exists
    const validator = SETTINGS_VALIDATION[payload.key as keyof typeof SETTINGS_VALIDATION];
    if (validator && !validator(payload.value)) {
        throw new AppError(StatusCodes.BAD_REQUEST, `Invalid value for setting: ${payload.key}`);
    }

    // Determine group from key
    const group = payload.key.split('.')[0].toUpperCase();

    const result = await prisma.setting.upsert({
        where: { key: payload.key },
        update: { value: payload.value },
        create: {
            key: payload.key,
            value: payload.value,
            group
        }
    });
    return result;
};

/**
 * Bulk update settings in a transaction
 */
const updateSettingsBulk = async (settings: Record<string, any>) => {
    const updates = Object.entries(settings).map(([key, value]) => {
        // Validate each setting
        const validator = SETTINGS_VALIDATION[key as keyof typeof SETTINGS_VALIDATION];
        if (validator && !validator(value)) {
            throw new AppError(StatusCodes.BAD_REQUEST, `Invalid value for setting: ${key}`);
        }

        const group = key.split('.')[0].toUpperCase();

        return prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value, group }
        });
    });

    await prisma.$transaction(updates);
    return getSettingsByCategory();
};

/**
 * Reset a setting to its default value
 */
const resetSetting = async (key: string) => {
    const defaultValue = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
    if (defaultValue === undefined) {
        throw new AppError(StatusCodes.NOT_FOUND, `No default value found for setting: ${key}`);
    }

    return updateSetting({ key, value: defaultValue });
};

/**
 * Reset all settings in a group to defaults
 */
const resetSettingsGroup = async (group: string) => {
    const settings = await prisma.setting.findMany({
        where: { group }
    });

    const updates = settings.map(setting => {
        const defaultValue = DEFAULT_SETTINGS[setting.key as keyof typeof DEFAULT_SETTINGS];
        if (defaultValue !== undefined) {
            return prisma.setting.update({
                where: { id: setting.id },
                data: { value: defaultValue }
            });
        }
        return null;
    }).filter(Boolean);

    if (updates.length > 0) {
        await prisma.$transaction(updates);
    }

    return getSettings(group);
};

/**
 * Delete a setting (will be recreated with default on next get)
 */
const deleteSetting = async (key: string) => {
    await prisma.setting.delete({
        where: { key }
    });

    return { success: true, message: 'Setting deleted successfully' };
};

export const SettingsService = {
    getSettings,
    getSettingsByCategory,
    getSetting,
    updateSetting,
    updateSettingsBulk,
    resetSetting,
    resetSettingsGroup,
    deleteSetting,
    initializeDefaultSettings,
};
