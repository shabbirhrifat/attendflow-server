import { Setting } from './settings.schema';
import BaseRepository from '../../repositories/BaseRepository';

/**
 * Setting Repository using MongoDB/Mongoose
 */
class SettingsRepository extends BaseRepository<any> {
  constructor() {
    super(Setting);
  }

  /**
   * Find setting by key
   */
  async findByKey(key: string) {
    return await this.model.findOne({ key });
  }

  /**
   * Find settings by group
   */
  async findByGroup(group: string) {
    return await this.model.find({ group }).sort({ key: 1 });
  }

  /**
   * Get setting value by key
   */
  async getValue(key: string): Promise<string | null> {
    const setting = await this.model.findOne({ key }).select('value');
    return setting?.value || null;
  }

  /**
   * Set setting value (create or update)
   */
  async setValue(key: string, value: string, group: string = 'GENERAL') {
    return await this.model.findOneAndUpdate(
      { key },
      { value, group },
      { upsert: true, new: true }
    );
  }

  /**
   * Get multiple settings by keys
   */
  async getValues(keys: string[]): Promise<Record<string, string>> {
    const settings = await this.model.find({ key: { $in: keys } }).select('key value');
    return settings.reduce((acc: Record<string, string>, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  /**
   * Set multiple settings
   */
  async setValues(settings: Record<string, { value: string; group?: string }>) {
    const operations = Object.entries(settings).map(([key, data]) => ({
      updateOne: {
        filter: { key },
        update: {
          $set: {
            value: data.value,
            group: data.group || 'GENERAL',
          },
        },
        upsert: true,
      },
    }));

    await this.model.bulkWrite(operations);

    return await this.getValues(Object.keys(settings));
  }

  /**
   * Delete setting by key
   */
  async deleteKey(key: string) {
    return await this.model.findOneAndDelete({ key });
  }

  /**
   * Get all settings as a key-value object
   */
  async getAllAsObject(): Promise<Record<string, string>> {
    const settings = await this.model.find().select('key value');
    return settings.reduce((acc: Record<string, string>, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  /**
   * Get all settings grouped
   */
  async getAllGrouped(): Promise<Record<string, Record<string, string>>> {
    const settings = await this.model.find().select('key value group');
    return settings.reduce((acc: Record<string, Record<string, string>>, setting: any) => {
      if (!acc[setting.group]) {
        acc[setting.group] = {};
      }
      acc[setting.group][setting.key] = setting.value;
      return acc;
    }, {});
  }

  /**
   * Initialize default settings
   */
  async initializeDefaults(defaults: Record<string, { value: string; group?: string }>) {
    const existingKeys = await this.model.distinct('key');
    const newDefaults = Object.entries(defaults)
      .filter(([key]) => !existingKeys.includes(key))
      .map(([key, data]) => ({
        key,
        value: data.value,
        group: data.group || 'GENERAL',
      }));

    if (newDefaults.length > 0) {
      await this.model.insertMany(newDefaults);
    }

    return await this.getAllAsObject();
  }
}

// Create singleton instance
const settingsRepository = new SettingsRepository();

// Export for backward compatibility
export { Setting };
export const SettingModel = settingsRepository;

export default settingsRepository;
