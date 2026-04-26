import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateUserToOranizationMapDto } from './dto/create-user-to-oranization-map.dto';
import { UpdateUserToOranizationMapDefaultDto } from './dto/update-user-to-oranization-map-default.dto';
import { UserToOranizationMapService } from './user-to-oranization-map.service';

@ApiTags('User To Oranization Map')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/user-to-oranization-map')
export class UserToOranizationMapController {
  constructor(
    private readonly userToOranizationMapService: UserToOranizationMapService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create user organization mapping' })
  @ApiResponse({ status: 201, description: 'Mapping created successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'User is already mapped to this organization' })
  async create(@Body() dto: CreateUserToOranizationMapDto) {
    const result = await this.userToOranizationMapService.create(dto);
    return new BaseResponseDto(result, 'User mapped to organization successfully');
  }

  @Patch('mapping/:userId/:organizationId/default')
  @ApiOperation({ summary: 'Update default organization mapping' })
  async updateDefault(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Body() dto: UpdateUserToOranizationMapDefaultDto,
  ) {
    const result = await this.userToOranizationMapService.updateDefault(userId, organizationId, dto);
    return new BaseResponseDto(result, 'Default organization updated successfully');
  }

  @Get('mapping/:userId/:organizationId')
  @ApiOperation({ summary: 'Get mapping by user and organization' })
  async findOne(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
  ) {
    const result = await this.userToOranizationMapService.findOne(userId, organizationId);
    return new BaseResponseDto(result, 'Mapping retrieved successfully');
  }

  @Get('organization/:organizationId/users')
  @ApiOperation({ summary: 'Get users by organization' })
  async findUsersByOrganization(@Param('organizationId', new ParseUUIDPipe()) organizationId: string) {
    const result = await this.userToOranizationMapService.findUsersByOrganization(organizationId);
    return new BaseResponseDto(result, 'Organization users retrieved successfully');
  }

  @Get('user/:userId/organizations')
  @ApiOperation({ summary: 'Get organizations by user' })
  async findOrganizationsByUser(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const result = await this.userToOranizationMapService.findOrganizationsByUser(userId);
    return new BaseResponseDto(result, 'User organizations retrieved successfully');
  }

  @Get('user/:userId/mappings')
  @ApiOperation({ summary: 'Get mappings by user' })
  async findMappingsByUser(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const result = await this.userToOranizationMapService.findMappingsByUser(userId);
    return new BaseResponseDto(result, 'User organization mappings retrieved successfully');
  }

  @Delete('mapping/:userId/:organizationId')
  @ApiOperation({ summary: 'Delete mapping' })
  async remove(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
  ) {
    const result = await this.userToOranizationMapService.remove(userId, organizationId);
    return new BaseResponseDto(result, 'Mapping deleted successfully');
  }
}
