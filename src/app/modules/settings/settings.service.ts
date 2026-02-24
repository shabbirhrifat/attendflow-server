import { SettingModel } from "./settings.model";
import { ISettingUpdate, DEFAULT_SETTINGS, SETTINGS_VALIDATION } from "./settings.interface";
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

/**
 * Initialize default settings if they don't exist
 */
const initializeDefaultSettings = async () => {
    const existingKeys = await SettingModel.model.find({}, { key: 1 });

    const existingKeySet = new Set(existingKeys.map((s: any) => s.key));
    const missingSettings = Object.entries(DEFAULT_SETTINGS).filter(
        ([key]) => !existingKeySet.has(key)
    );

    if (missingSettings.length > 0) {
        // Group settings by their group (extract from key prefix)
        const createPromises = missingSettings.map(([key, value]) => {
            const group = key.split('.')[0].toUpperCase();
            return SettingModel.model.create({
                key,
                value,
                group,
            });
        });

        await Promise.all(createPromises);
    }
};

/**
 * Get all settings, optionally filtered by group
 */
const getSettings = async (group?: string) => {
    // Ensure default settings exist
    await initializeDefaultSettings();

    const where = group ? { group } : {};
    const settings = await SettingModel.model.find(where);

    // Transform to key-value object
    return settings.reduce((acc, curr) => {
        const currObj = curr.toObject ? curr.toObject() : curr;
        acc[currObj.key] = currObj.value;
        return acc;
    }, {} as Record<string, any>);
};

/**
 * Get settings organized by category
 */
const getSettingsByCategory = async () => {
    await initializeDefaultSettings();

    const settings = await SettingModel.model.find();
    const grouped = settings.reduce((acc, curr) => {
        const currObj = curr.toObject ? curr.toObject() : curr;
        const category = currObj.key.split('.')[0];
        if (!acc[category]) {
            acc[category] = {};
        }
        acc[category][currObj.key.replace(`${category}.`, '')] = currObj.value;
        return acc;
    }, {} as Record<string, any>);

    return grouped;
};

/**
 * Get a single setting by key
 */
const getSetting = async (key: string) => {
    await initializeDefaultSettings();

    const setting = await SettingModel.model.findOne({ key });

    if (!setting) {
        return DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] || null;
    }

    const settingObj = setting.toObject ? setting.toObject() : setting;
    return settingObj.value;
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

    const result = await SettingModel.model.findOneAndUpdate(
        { key: payload.key },
        { value: payload.value },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!result) {
        await SettingModel.model.create({
            key: payload.key,
            value: payload.value,
            group
        });
    }

    return result;
};

/**
 * Bulk update settings in a transaction
 */
const updateSettingsBulk = async (settings: Record<string, any>) => {
    const updates = Object.entries(settings).map(async ([key, value]) => {
        // Validate each setting
        const validator = SETTINGS_VALIDATION[key as keyof typeof SETTINGS_VALIDATION];
        if (validator && !validator(value)) {
            throw new AppError(StatusCodes.BAD_REQUEST, `Invalid value for setting: ${key}`);
        }

        const group = key.split('.')[0].toUpperCase();

        return SettingModel.model.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    });

    await Promise.all(updates);
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
    const settings = await SettingModel.model.find({ group });

    const updates = settings.map(async (setting) => {
        const settingObj = setting.toObject ? setting.toObject() : setting;
        const defaultValue = DEFAULT_SETTINGS[settingObj.key as keyof typeof DEFAULT_SETTINGS];
        if (defaultValue !== undefined) {
            return SettingModel.model.findByIdAndUpdate(
                setting._id,
                { value: defaultValue }
            );
        }
        return null;
    }).filter(Boolean);

    if (updates.length > 0) {
        await Promise.all(updates);
    }

    return getSettings(group);
};

/**
 * Delete a setting (will be recreated with default on next get)
 */
const deleteSetting = async (key: string) => {
    await SettingModel.model.findOneAndDelete({ key });

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
