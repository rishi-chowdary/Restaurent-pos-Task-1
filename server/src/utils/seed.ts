import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { MenuItemModel } from '../models/menu-item.model';
import { SettingsModel } from '../models/settings.model';

export async function seedDatabase(): Promise<void> {
  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const staffPasswordHash = await bcrypt.hash('staff123', 10);

    const admin = await UserModel.create({
      name: 'Elena Rostova',
      email: 'admin@restaurant.com',
      passwordHash: adminPasswordHash,
      role: 'Admin',
    });

    await UserModel.create({
      name: 'Marcus Chen',
      email: 'staff@restaurant.com',
      passwordHash: staffPasswordHash,
      role: 'Staff',
    });

    await SettingsModel.create({
      taxRate: 5.0,
      updatedBy: admin._id,
    });

    process.stdout.write('[seed] Seeded default Admin and Staff accounts\n');
  }

  const itemCount = await MenuItemModel.countDocuments();
  if (itemCount === 0) {
    const initialItems = [
      { name: 'Truffle Brioche Burger', category: 'Burgers', price: 14.99, isAvailable: true, isActive: true },
      { name: 'Crispy Buttermilk Chicken', category: 'Burgers', price: 12.5, isAvailable: true, isActive: true },
      { name: 'Portobello Mushroom Melt', category: 'Burgers', price: 11.0, isAvailable: true, isActive: true },
      { name: 'Classic Margherita Pizza', category: 'Pizzas', price: 13.5, isAvailable: true, isActive: true },
      { name: 'Pepperoni Rustica Pizza', category: 'Pizzas', price: 15.99, isAvailable: true, isActive: true },
      { name: 'Wild Mushroom & Truffle Pizza', category: 'Pizzas', price: 16.5, isAvailable: true, isActive: true },
      { name: 'Garlic Parmesan Fries', category: 'Appetizers', price: 6.5, isAvailable: true, isActive: true },
      { name: 'Spicy Glazed Buffalo Wings', category: 'Appetizers', price: 9.99, isAvailable: true, isActive: true },
      { name: 'Crispy Herb Calamari', category: 'Appetizers', price: 11.5, isAvailable: true, isActive: true },
      { name: 'Artisanal Cold Brew Coffee', category: 'Beverages', price: 4.5, isAvailable: true, isActive: true },
      { name: 'Handcrafted Berry Lemonade', category: 'Beverages', price: 5.0, isAvailable: true, isActive: true },
      { name: 'Sparkling Peach Iced Tea', category: 'Beverages', price: 4.25, isAvailable: true, isActive: true },
      { name: 'Belgian Chocolate Lava Cake', category: 'Desserts', price: 8.5, isAvailable: true, isActive: true },
      { name: 'Vanilla Bean Cheesecake', category: 'Desserts', price: 7.99, isAvailable: true, isActive: true },
    ];

    await MenuItemModel.insertMany(initialItems);
    process.stdout.write('[seed] Seeded restaurant menu items\n');
  }
}
