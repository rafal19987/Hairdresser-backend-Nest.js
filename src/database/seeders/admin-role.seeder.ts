import { DataSource } from 'typeorm';
import { Role } from '@/roles/entities/role.entity';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';

export const ADMIN_ROLE_NAME = 'admin';

export async function seedAdminRole(dataSource: DataSource): Promise<Role> {
  const roleRepository = dataSource.getRepository(Role);

  const existing = await roleRepository.findOne({
    where: { name: ADMIN_ROLE_NAME },
  });

  if (existing) {
    console.log('Admin role already exists.');
    return existing;
  }

  const adminRole = roleRepository.create({
    name: ADMIN_ROLE_NAME,
    displayName: 'Administrator',
    permissions: [
      {
        resource: Resource.USERS,
        actions: [
          Action.ADMIN,
          Action.ALL,
          Action.CREATE,
          Action.READ,
          Action.WRITE,
          Action.DELETE,
        ],
      },
      {
        resource: Resource.ROLES,
        actions: [
          Action.ADMIN,
          Action.ALL,
          Action.CREATE,
          Action.READ,
          Action.WRITE,
          Action.DELETE,
        ],
      },
      {
        resource: Resource.SERVICES,
        actions: [
          Action.ADMIN,
          Action.ALL,
          Action.CREATE,
          Action.READ,
          Action.WRITE,
          Action.DELETE,
        ],
      },
      {
        resource: Resource.CALENDAR,
        actions: [
          Action.ADMIN,
          Action.ALL,
          Action.CREATE,
          Action.READ,
          Action.WRITE,
          Action.DELETE,
        ],
      },
      {
        resource: Resource.CLIENTS,
        actions: [
          Action.ADMIN,
          Action.ALL,
          Action.CREATE,
          Action.READ,
          Action.WRITE,
          Action.DELETE,
        ],
      },
    ],
  });

  await roleRepository.save(adminRole);
  console.log('Admin role created.');
  return adminRole;
}
