import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { AppController } from './app.controller';
import { AppService, createTypeOrmOptions } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MenuAccessGuard } from './common/guards/menu-access.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { ContactModule } from './contact/contact.module';
import { FilesModule } from './files/files.module';
import { UserLocationModule } from './user-location/user-location.module';
import { ColorModule } from './merchandising/master-data/color/color.module';
import { SizeModule } from './merchandising/master-data/size/size.module';
import { FabricProcessModule } from './merchandising/master-data/fabric-process/fabric-process.module';
import { EmbellishmentModule } from './merchandising/master-data/embellishment/embellishment.module';
import { CurrencyModule } from './app-configuration/currency/currency.module';
import { UnitModule } from './app-configuration/unit/unit.module';
import { CountryModule } from './app-configuration/country/country.module';
import { MenuModule } from './app-configuration/menu/menu.module';
import { MenuPermissionModule } from './app-configuration/menu-permission/menu-permission.module';
import { MenuToOrganizationMapModule } from './app-configuration/menu-to-organization-map/menu-to-organization-map.module';
import { ModuleEntryModule } from './app-configuration/module-entry/module-entry.module';
import { OrganizationModule } from './app-configuration/organization/organization.module';
import { UserToOranizationMapModule } from './app-configuration/user-to-oranization-map/user-to-oranization-map.module';
import { OrganizationAccessRequestModule } from './app-configuration/organization-access-request/organization-access-request.module';
import { BuyerModule } from './merchandising/buyer/buyer.module';
import { StyleModule } from './merchandising/style/style.module';
import { TnaTaskModule } from './merchandising/master-data/tna-task/tna-task.module';
import { TnaModule } from './merchandising/tna/tna.module';
import { CommonController } from './common/common.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { FactoryModule } from './app-configuration/factory/factory.module';
import { SupplierModule } from './app-configuration/supplier/supplier.module';
import { MaterialModule } from './app-configuration/material/material.module';
import { MaterialGroupModule } from './app-configuration/material-group/material-group.module';
import { DepartmentModule } from './hr-payroll/master-data/department/department.module';
import { DesignationModule } from './hr-payroll/master-data/designation/designation.module';
import { EmployeeModule } from './hr-payroll/employee/employee.module';
import { JobModule } from './merchandising/job/job.module';
import { OrderPlacementModule } from './merchandising/order-placement/order-placement.module';
import { FabricCostingModule } from './merchandising/fabric-costing/fabric-costing.module';
import { GmtCostScopeModule } from './merchandising/master-data/gmt-cost-scope/gmt-cost-scope.module';
import { AttendanceModule } from './hr-payroll/attendance/attendance.module';
import { AuditModule } from './hr-payroll/audit/audit.module';
import { HealthModule } from './hr-payroll/health/health.module';
import { ImportsModule } from './hr-payroll/imports/imports.module';
import { LeaveModule } from './hr-payroll/leave/leave.module';
import { LoanModule } from './hr-payroll/loan/loan.module';
import { MasterDataModule } from './hr-payroll/master-data/master-data/master-data.module';
import { OrganizationSettingsModule } from './hr-payroll/master-data/organization-settings/organization-settings.module';
import { SalaryStructureModule } from './hr-payroll/master-data/salary-structure/salary-structure.module';
import { ShiftModule } from './hr-payroll/master-data/shift/shift.module';
import { StatutoryRuleModule } from './hr-payroll/master-data/statutory-rule/statutory-rule.module';
import { PayrollModule } from './hr-payroll/payroll/payroll.module';
import { ReportsModule } from './hr-payroll/reports/reports.module';
import { RosterModule } from './hr-payroll/roster/roster.module';
import { SalaryModule } from './hr-payroll/salary/salary.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
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
    FabricProcessModule,
    EmbellishmentModule,
    CurrencyModule,
    UnitModule,
    CountryModule,
    MenuModule,
    MenuPermissionModule,
    MenuToOrganizationMapModule,
    ModuleEntryModule,
    OrganizationModule,
    NotificationsModule,
    UserToOranizationMapModule,
    OrganizationAccessRequestModule,
    BuyerModule,
    StyleModule,
    TnaTaskModule,
    TnaModule,
    FactoryModule,
    SupplierModule,
    MaterialGroupModule,
    MaterialModule,
    DepartmentModule,
    DesignationModule,
    EmployeeModule,
    JobModule,
    OrderPlacementModule,
    FabricCostingModule,
    GmtCostScopeModule,
    AuditModule,
    OrganizationSettingsModule,
    MasterDataModule,
    ShiftModule,
    SalaryStructureModule,
    StatutoryRuleModule,
    AttendanceModule,
    RosterModule,
    LeaveModule,
    SalaryModule,
    LoanModule,
    PayrollModule,
    ImportsModule,
    ReportsModule,
    HealthModule,
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
    {
      provide: APP_GUARD,
      useClass: MenuAccessGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
