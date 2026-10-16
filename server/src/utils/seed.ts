import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { MenuItemModel } from '../models/menu-item.model';
import { SettingsModel } from '../models/settings.model';

export const INDIAN_MENU_ITEMS = [
  // Biryani & Rice
  { name: 'Hyderabadi Chicken Dum Biryani', category: 'Biryani & Rice', price: 320, isAvailable: true, isActive: true },
  { name: 'Awadhi Mutton Dum Biryani', category: 'Biryani & Rice', price: 420, isAvailable: true, isActive: true },
  { name: 'Paneer Tikka Dum Biryani', category: 'Biryani & Rice', price: 260, isAvailable: true, isActive: true },
  { name: 'Basmati Jeera Rice', category: 'Biryani & Rice', price: 140, isAvailable: true, isActive: true },

  // Starters & Tandoor
  { name: 'Paneer Tikka (Tandoori)', category: 'Starters & Tandoor', price: 240, isAvailable: true, isActive: true },
  { name: 'Chicken Malai Tikka', category: 'Starters & Tandoor', price: 290, isAvailable: true, isActive: true },
  { name: 'Tandoori Murgh (Half)', category: 'Starters & Tandoor', price: 280, isAvailable: true, isActive: true },
  { name: 'Crispy Hara Bhara Kebab', category: 'Starters & Tandoor', price: 190, isAvailable: true, isActive: true },
  { name: 'Amritsari Fish Fry', category: 'Starters & Tandoor', price: 340, isAvailable: true, isActive: true },

  // Curries & Gravies
  { name: 'Murgh Makhani (Butter Chicken)', category: 'Curries & Gravies', price: 330, isAvailable: true, isActive: true },
  { name: 'Paneer Butter Masala', category: 'Curries & Gravies', price: 260, isAvailable: true, isActive: true },
  { name: 'Dal Makhani (Slow-Cooked)', category: 'Curries & Gravies', price: 210, isAvailable: true, isActive: true },
  { name: 'Kashmiri Mutton Rogan Josh', category: 'Curries & Gravies', price: 410, isAvailable: true, isActive: true },
  { name: 'Kadai Paneer', category: 'Curries & Gravies', price: 250, isAvailable: true, isActive: true },

  // Breads & Raitas
  { name: 'Butter Naan', category: 'Breads & Raitas', price: 45, isAvailable: true, isActive: true },
  { name: 'Garlic Coriander Naan', category: 'Breads & Raitas', price: 55, isAvailable: true, isActive: true },
  { name: 'Tandoori Roti (Butter)', category: 'Breads & Raitas', price: 30, isAvailable: true, isActive: true },
  { name: 'Boondi Raita', category: 'Breads & Raitas', price: 60, isAvailable: true, isActive: true },

  // Beverages & Desserts
  { name: 'Kesar Mango Lassi', category: 'Beverages & Desserts', price: 90, isAvailable: true, isActive: true },
  { name: 'Kulhad Masala Chai', category: 'Beverages & Desserts', price: 40, isAvailable: true, isActive: true },
  { name: 'Gulab Jamun with Rabdi (2 pcs)', category: 'Beverages & Desserts', price: 110, isAvailable: true, isActive: true },
  { name: 'Royal Rasmalai (2 pcs)', category: 'Beverages & Desserts', price: 120, isAvailable: true, isActive: true },
];

export async function seedDatabase(): Promise<void> {
  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const staffPasswordHash = await bcrypt.hash('staff123', 10);

    const admin = await UserModel.create({
      name: 'Rohan Sharma',
      email: 'admin@restaurant.com',
      passwordHash: adminPasswordHash,
      role: 'Admin',
    });

    await UserModel.create({
      name: 'Priya Patel',
      email: 'staff@restaurant.com',
      passwordHash: staffPasswordHash,
      role: 'Staff',
    });

    await SettingsModel.create({
      taxRate: 5.0, // Standard 5% GST for restaurant services in India
      updatedBy: admin._id,
    });

    process.stdout.write('[seed] Seeded default Admin and Staff accounts\n');
  }

  // Check if Indian menu items are already seeded
  const hasIndianDish = await MenuItemModel.findOne({ name: 'Hyderabadi Chicken Dum Biryani' });
  if (!hasIndianDish) {
    await MenuItemModel.deleteMany({});
    await MenuItemModel.insertMany(INDIAN_MENU_ITEMS);
    process.stdout.write('[seed] Seeded authentic Indian restaurant menu in Indian Rupees (INR)\n');
  }
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  import('../config/db').then(async ({ connectDatabase, disconnectDatabase }) => {
    try {
      await connectDatabase();
      await seedDatabase();
      process.stdout.write('[seed] Seeding completed successfully!\n');
    } catch (e) {
      process.stderr.write(`[seed] Seeding failed: ${(e as Error).message}\n`);
    } finally {
      await disconnectDatabase();
      process.exit(0);
    }
  });
}
