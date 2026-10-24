import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/users/entities/user.entity';
import { Role } from '@/roles/entities/role.entity';

export async function seedAdminUser(
  dataSource: DataSource,
  adminRole: Role,
): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@hairdresser.pl';

  const existing = await userRepository.findOne({ where: { email } });

  if (existing) {
    console.log('Admin user already exists.');
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const adminUser = userRepository.create({
    email,
    username: email,
    password: hashedPassword,
    active: true,
    role: adminRole,
  });

  await userRepository.save(adminUser);
  console.log(`User created: ${email}`);
  console.log(`Secret Password: ${password}`);
}
