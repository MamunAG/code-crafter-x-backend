import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';
import { EmailVerificationToken } from './auth/entities/email-verification-token.entity';
import { User } from './users/entities/user.entity';
import { Files } from './files/entities/file.entity';
import { FileReference } from './files/entities/file-reference.entity';
import { DeleteAccount } from './users/entities/delete-account.entity';
import { Contact } from './contact/entity/contact.entity';
import { UserLocation } from './user-location/entities/user-location.entity';
import { Color } from './merchandising/master-data/color/entity/color.entity';
import { Size } from './merchandising/master-data/size/entity/size.entity';
import { Embellishment } from './merchandising/master-data/embellishment/entity/embellishment.entity';
import { TnaTask } from './merchandising/master-data/tna-task/entity/tna-task.entity';
import { Currency } from './app-configuration/currency/entity/currency.entity';
import { Unit } from './app-configuration/unit/entity/unit.entity';
import { Country } from './app-configuration/country/entity/country.entity';
import { Menu } from './app-configuration/menu/entity/menu.entity';
import { MenuPermission } from './app-configuration/menu-permission/entity/menu-permission.entity';
import { MenuToOrganizationMap } from './app-configuration/menu-to-organization-map/entity/menu-to-organization-map.entity';
import { ModuleEntry } from './app-configuration/module-entry/entity/module-entry.entity';
import { Organization } from './app-configuration/organization/entity/organization.entity';
import { UserToOranizationMap } from './app-configuration/user-to-oranization-map/entity/user-to-oranization-map.entity';
import { OrganizationAccessRequest } from './app-configuration/organization-access-request/entity/organization-access-request.entity';
import { Buyer } from './merchandising/buyer/entity/buyer.entity';
import { Style } from './merchandising/style/entity/style.entity';
import { StyleToColorMap } from './merchandising/style/entity/style-to-color-map.entity';
import { StyleToEmbellishmentMap } from './merchandising/style/entity/style-to-embellishment-map.entity';
import { StyleToSizeMap } from './merchandising/style/entity/style-to-size-map.entity';
import { Notification } from './notifications/entity/notification.entity';
import { UserFirebaseToken } from './notifications/entity/user-firebase-token.entity';
import { Factory } from './app-configuration/factory/entity/factory.entity';
import { Supplier } from './app-configuration/supplier/entity/supplier.entity';
import { Material } from './app-configuration/material/entity/material.entity';
import { MaterialGroup } from './app-configuration/material-group/entity/material-group.entity';
import { Designation } from './hr-payroll/master-data/designation/entity/designation.entity';
import { Department } from './hr-payroll/master-data/department/entity/department.entity';
import { Employee } from './hr-payroll/employee/entity/employee.entity';
import { PurchaseOrder } from './merchandising/job/entity/purchase-order.entity';
import { Job } from './merchandising/job/entity/job.entity';
import { JobDetails } from './merchandising/job/entity/job-details.entity';
import { Tna } from './merchandising/tna/entity/tna.entity';
import { TnaDetail } from './merchandising/tna/entity/tna-details.entity';
import { TnaDetailRevision } from './merchandising/tna/entity/tna-detail-revision.entity';
import { getDatabasePoolConfig } from './config/database-pool.config';
import { CurrencyExchangeRate } from './app-configuration/currency/entity/currency-exchange-rate.entity';
import { OrderPlacement } from './merchandising/order-placement/entity/order-placement.entity';
import { OrderPlacementDetails } from './merchandising/order-placement/entity/order-placement-details.entity';

const databaseLogger = new Logger('Database');

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const poolConfig = getDatabasePoolConfig((key) =>
    configService.get<string>(key),
  );

  databaseLogger.log(
    `Database pool configured: max=${poolConfig.max}, idleTimeoutMillis=${poolConfig.idleTimeoutMillis}, connectionTimeoutMillis=${poolConfig.connectionTimeoutMillis}`,
  );

  return {
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: Number.parseInt(configService.get<string>('DB_PORT') || '5432', 10),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [
      RefreshToken,
      PasswordResetToken,
      EmailVerificationToken,
      User,
      Files,
      FileReference,
      DeleteAccount,
      Contact,
      UserLocation,
      Color,
      Size,
      Embellishment,
      TnaTask,
      Currency,
      Unit,
      Country,
      Menu,
      MenuPermission,
      MenuToOrganizationMap,
      ModuleEntry,
      Organization,
      UserToOranizationMap,
      OrganizationAccessRequest,
      Notification,
      UserFirebaseToken,
      Buyer,
      Style,
      StyleToColorMap,
      StyleToEmbellishmentMap,
      StyleToSizeMap,
      Factory,
      Supplier,
      MaterialGroup,
      Material,
      Designation,
      Department,
      Employee,
      PurchaseOrder,
      Job,
      JobDetails,
      Tna,
      TnaDetail,
      TnaDetailRevision,
      CurrencyExchangeRate,
      OrderPlacement,
      OrderPlacementDetails,
    ],
    synchronize: false, // Never use synchronize in production
    logging: isDevelopment,
    migrations: isDevelopment ? [] : ['dist/migrations/*.js'],
    migrationsRun: !isDevelopment,
    migrationsTableName: 'migrations',
    extra: {
      max: poolConfig.max,
      idleTimeoutMillis: poolConfig.idleTimeoutMillis,
      connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
    },
    // SSL configuration - controlled by environment variable
    ssl:
      configService.get('DB_SSL_ENABLED') === 'true'
        ? {
          rejectUnauthorized: false,
        }
        : false,
    // Retry configuration
    retryAttempts: 10,
    retryDelay: 3000,
  };
}

@Injectable()
export class AppService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return createTypeOrmOptions(this.configService);
  }
}
