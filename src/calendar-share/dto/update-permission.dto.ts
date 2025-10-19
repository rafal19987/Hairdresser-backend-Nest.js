import { IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionDto {
  @ApiProperty({
    description: 'Nowy poziom uprawnień',
    enum: ['read', 'create', 'write', 'full'],
    example: 'write',
    required: true,
  })
  @IsNotEmpty({ message: 'Poziom uprawnień jest wymagany' })
  @IsIn(['read', 'create', 'write', 'full'], {
    message: 'Dozwolone poziomy uprawnień: read, create, write, full',
  })
  permission: 'read' | 'create' | 'write' | 'full';
}
