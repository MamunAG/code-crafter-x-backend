import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';
import { User } from './users/entities/user.entity';
import { Files } from './files/entities/file.entity';
import { FileReference } from './files/entities/file-reference.entity';
import { DeleteAccount } from './users/entities/delete-account.entity';
import { Contact } from './contact/entity/contact.entity';
import { UserLocation } from './user-location/entities/user-location.entity';
import { Color } from './merchandising/basic-setup/color/entity/color.entity';
import { Size } from './merchandising/basic-setup/size/entity/size.entity';
import { Embellishment } from './merchandising/basic-setup/embellishment/entity/embellishment.entity';
import { Currency } from './app-configuration/currency/entity/currency.entity';
import { Uom } from './app-configuration/uom/entity/uom.entity';
import { Country } from './app-configuration/country/entity/country.entity';
import { Buyer } from './merchandising/buyer/entity/buyer.entity';
import { Style } from './merchandising/style/entity/style.entity';
import { StyleToColorMap } from './merchandising/style/entity/style-to-color-map.entity';
import { StyleToEmbellishmentMap } from './merchandising/style/entity/style-to-embellishment-map.entity';
import { StyleToSizeMap } from './merchandising/style/entity/style-to-size-map.entity';

@Injectable()

export class AppService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_NAME'),
      entities: [
        RefreshToken,
        PasswordResetToken,
        User,
        Files,
        FileReference,
        DeleteAccount,
        Contact,
        UserLocation,
        Color,
        Size,
        Embellishment,
        Currency,
        Uom,
        Country,
        Buyer,
        Style,
        StyleToColorMap,
        StyleToEmbellishmentMap,
        StyleToSizeMap
      ],
      synchronize: false, // Never use synchronize in production
      logging: isDevelopment,
      migrations: isDevelopment ? [] : ['dist/migrations/*.js'],
      migrationsRun: !isDevelopment,
      migrationsTableName: 'migrations',
      // Connection pool settings
      extra: {
        max: 20, // Maximum number of connections in the pool
        min: 5, // Minimum number of connections in the pool
        acquire: 60000, // Maximum time (ms) that pool will try to get connection before throwing error
        idle: 10000, // Maximum time (ms) that a connection can be idle before being released
      },
      // SSL configuration - controlled by environment variable
      ssl:
        this.configService.get('DB_SSL_ENABLED') === 'true'
          ? {
            rejectUnauthorized: false,
          }
          : false,
      // Retry configuration
      retryAttempts: 10,
      retryDelay: 3000,
    };
  }
}

