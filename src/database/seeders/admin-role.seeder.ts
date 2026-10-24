import { DataSource } from 'typeorm';
import { PermissionDto, Role } from '@/roles/entities/role.entity';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';

export const ADMIN_ROLE_NAME = 'admin';

const ADMIN_ACTIONS = [
  Action.ADMIN,
  Action.ALL,
  Action.CREATE,
  Action.READ,
  Action.WRITE,
  Action.DELETE,
];

const ADMIN_PERMISSIONS: PermissionDto[] = Object.values(Resource).map(
  resource => ({ resource, actions: ADMIN_ACTIONS }),
);

export async function seedAdminRole(dataSource: DataSource): Promise<Role> {
  const roleRepository = dataSource.getRepository(Role);

  const existing = await roleRepository.findOne({
    where: { name: ADMIN_ROLE_NAME },
  });

  if (existing) {
    const missing = ADMIN_PERMISSIONS.filter(
      permission =>
        !existing.permissions.some(
          current => current.resource === permission.resource,
        ),
    );

    if (missing.length === 0) {
      console.log('Admin role already exists.');
      return existing;
    }

    existing.permissions = [...existing.permissions, ...missing];
    await roleRepository.save(existing);
    console.log(
      `Admin role updated with: ${missing.map(p => p.resource).join(', ')}.`,
    );
    return existing;
  }

  const adminRole = roleRepository.create({
    name: ADMIN_ROLE_NAME,
    displayName: 'Administrator',
    permissions: ADMIN_PERMISSIONS,
  });

  await roleRepository.save(adminRole);
  console.log('Admin role created.');
  return adminRole;
}
