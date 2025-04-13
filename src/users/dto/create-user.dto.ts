// import { Role } from 'src/auth/enums/role.enum';

export class CreateUserDto {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  // role?: Role;
  createdAd: Date;
  invintationToken?: string;
  invintationDate?: string;
}
