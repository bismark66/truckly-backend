import { SetMetadata } from '@nestjs/common';
import { UserType } from '../users/entities/user.entity';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
