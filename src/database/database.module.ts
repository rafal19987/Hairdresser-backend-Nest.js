import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV');
        const isProd = nodeEnv === 'production';

        return {
          type: 'mysql',
          host: configService.get('MYSQL_HOST'),
          port: parseInt(configService.get('MYSQL_PORT'), 10),
          database: configService.get('MYSQL_DATABASE'),
          username: configService.get('MYSQL_USERNAME'),
          password: configService.get('MYSQL_PASSWORD'),
          autoLoadEntities: true,
          synchronize: configService.get('MYSQL_SYNCHRONIZE'),
          retryAttempts: 5,
          retryDelay: 3000,
          migrationsRun: isProd,
          migrationsTableName: 'migration_table',
          migrations: ['dist/migrations/*.js'],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
