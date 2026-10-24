import { DataSource } from 'typeorm';
import { seedAdminRole } from './admin-role.seeder';
import { seedAdminUser } from './admin-user.seeder';

export async function runSeeders(dataSource: DataSource): Promise<void> {
  const adminRole = await seedAdminRole(dataSource);
  await seedAdminUser(dataSource, adminRole);
}
