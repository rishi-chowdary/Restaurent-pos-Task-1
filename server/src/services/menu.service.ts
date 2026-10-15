import { MenuItemModel, IMenuItem } from '../models/menu-item.model';
import { CreateMenuItemInput, UpdateMenuItemInput } from '../validations/menu.validation';
import { AppError } from '../utils/app-error';

interface MenuFilters {
  q?: string;
  category?: string;
  available?: string;
}

export async function getMenuItems(filters: MenuFilters): Promise<IMenuItem[]> {
  const query: Record<string, unknown> = {};

  if (filters.q) {
    query.name = { $regex: filters.q, $options: 'i' };
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.available !== undefined) {
    query.isAvailable = filters.available === 'true';
  }

  return MenuItemModel.find(query).sort({ category: 1, name: 1 });
}

export async function getMenuItemById(id: string): Promise<IMenuItem> {
  const item = await MenuItemModel.findById(id);
  if (!item) {
    throw new AppError('Menu item not found.', 404, 'ITEM_NOT_FOUND');
  }
  return item;
}

export async function createMenuItem(data: CreateMenuItemInput): Promise<IMenuItem> {
  const existing = await MenuItemModel.findOne({
    name: { $regex: new RegExp(`^${data.name}$`, 'i') },
  });
  if (existing) {
    throw new AppError('A menu item with this name already exists.', 409, 'DUPLICATE_ITEM_NAME');
  }

  return MenuItemModel.create(data);
}

export async function updateMenuItem(id: string, data: UpdateMenuItemInput): Promise<IMenuItem> {
  const item = await MenuItemModel.findById(id);
  if (!item) {
    throw new AppError('Menu item not found.', 404, 'ITEM_NOT_FOUND');
  }

  if (data.name && data.name.toLowerCase() !== item.name.toLowerCase()) {
    const existing = await MenuItemModel.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    });
    if (existing) {
      throw new AppError('Another menu item already has this name.', 409, 'DUPLICATE_ITEM_NAME');
    }
  }

  Object.assign(item, data);
  return item.save();
}

export async function deactivateMenuItem(id: string): Promise<IMenuItem> {
  const item = await MenuItemModel.findById(id);
  if (!item) {
    throw new AppError('Menu item not found.', 404, 'ITEM_NOT_FOUND');
  }

  item.isActive = !item.isActive;
  return item.save();
}
