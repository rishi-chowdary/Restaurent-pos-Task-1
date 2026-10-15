import { SettingsModel } from '../models/settings.model';
import { env } from '../config/env';

export async function getSystemTaxRate(): Promise<number> {
  const settings = await SettingsModel.findOne().sort({ createdAt: -1 });
  if (!settings) {
    return env.defaultTaxRate;
  }
  return settings.taxRate;
}

export async function updateSystemTaxRate(taxRate: number, adminUserId: string) {
  let settings = await SettingsModel.findOne();
  if (!settings) {
    settings = await SettingsModel.create({
      taxRate,
      updatedBy: adminUserId,
    });
  } else {
    settings.taxRate = taxRate;
    settings.updatedBy = adminUserId as any;
    await settings.save();
  }

  return {
    taxRate: settings.taxRate,
    updatedAt: settings.updatedAt,
  };
}
