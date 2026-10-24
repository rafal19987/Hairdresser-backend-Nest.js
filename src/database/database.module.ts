import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mysql',
          host: configService.get('MYSQL_HOST'),
          port: parseInt(configService.get('MYSQL_PORT'), 10),
          database: configService.get('MYSQL_DATABASE'),
          username: configService.get('MYSQL_USERNAME'),
          password: configService.get('MYSQL_PASSWORD'),
          // Store dates in UTC regardless of the host time zone (local machine vs Docker)
          timezone: 'Z',
          autoLoadEntities: true,
          synchronize: configService.get('MYSQL_SYNCHRONIZE') === 'true',
          retryAttempts: 5,
          retryDelay: 3000,
          migrationsRun: true,
          migrationsTableName: 'migration_table',
          migrations: ['dist/migrations/*.js'],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
