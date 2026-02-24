import mongoose, { Schema } from 'mongoose';

/**
 * Setting Schema for MongoDB
 * Corresponds to Prisma Setting model
 */

// Setting interface
export interface ISetting {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: string;
  group: string;
  createdAt: Date;
  updatedAt: Date;
}

// Setting schema definition
const SettingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
    group: {
      type: String,
      default: 'GENERAL',
    },
  },
  {
    timestamps: true,
  }
);

SettingSchema.index({ key: 1 }, { unique: true });
SettingSchema.index({ group: 1 });

// Export Setting model
export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
