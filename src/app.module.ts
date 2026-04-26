import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { ContactModule } from './contact/contact.module';
import { FilesModule } from './files/files.module';
import { UserLocationModule } from './user-location/user-location.module';
import { ColorModule } from './merchandising/basic-setup/color/color.module';
import { SizeModule } from './merchandising/basic-setup/size/size.module';
import { EmbellishmentModule } from './merchandising/basic-setup/embellishment/embellishment.module';
import { CurrencyModule } from './app-configuration/currency/currency.module';
import { UomModule } from './app-configuration/uom/uom.module';
import { CountryModule } from './app-configuration/country/country.module';
import { OrganizationModule } from './app-configuration/organization/organization.module';
import { UserToOranizationMapModule } from './app-configuration/user-to-oranization-map/user-to-oranization-map.module';
import { OrganizationAccessRequestModule } from './app-configuration/organization-access-request/organization-access-request.module';
import { BuyerModule } from './merchandising/buyer/buyer.module';
import { StyleModule } from './merchandising/style/style.module';
import { CommonController } from './common/common.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: AppService,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    CommandModule,
    UsersModule,
    FilesModule,
    ContactModule,
    UserLocationModule,
    ColorModule,
    SizeModule,
    EmbellishmentModule,
    CurrencyModule,
    UomModule,
    CountryModule,
    OrganizationModule,
    UserToOranizationMapModule,
    OrganizationAccessRequestModule,
    BuyerModule,
    StyleModule,
  ],
  controllers: [AppController, CommonController],
  providers: [
    AppService,
    // AuditInterceptorProvider,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
