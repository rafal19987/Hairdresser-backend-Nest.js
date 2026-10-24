import { forwardRef, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '@/audit-log/entities/audit-log.entity';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { User } from '@/users/entities/user.entity';
import { Client } from '@/clients/entities/client.entity';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AuditLogController } from '@/audit-log/audit-log.controller';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';

// Global because any module may record audit entries
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, User, Client, Appointment]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [AuditLogService],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
