import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserLocationService } from './user-location.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilterUserLocationDto } from './dto/filter-user-location.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';
import { CreateUserLocationDto } from './dto/create-user-location.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { UpdateUserLocationDto } from './dto/update-user-location.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('User Loaction')
@ApiBearerAuth()
@Public()
@Controller('api/v1/user-location')
export class UserLocationController {
    constructor(private readonly userLocationService: UserLocationService) { }

    @Get()
    @ApiOperation({ summary: 'Get all with pagination and filters', description: 'Retrieves a paginated list of all active with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getIncomingRequests(@Query() filters: FilterUserLocationDto) {
        const { page, limit, ...userlocationsFilters } = filters;
        const pagination = { page, limit };
        const userlocations = await this.userLocationService.findAll(pagination, userlocationsFilters);
        return new BaseResponseDto(userlocations, 'UserLocations retrieved successfully');
    }


    @Get(':id')
    @ApiOperation({ summary: 'Get all with pagination and filters', description: 'Retrieves a paginated list of all active with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getOutgoingRequests(@Param('id', new ParseUUIDPipe()) id: string) {
        const userlocations = await this.userLocationService.findOne(id);
        return new BaseResponseDto(userlocations, 'UserLocations retrieved successfully');
    }

    @Post()
    @ApiOperation({ summary: 'save userlocation' })
    @ApiResponse({ status: 201, description: 'UserLocation save successfully', type: BaseResponseDto, })
    @ApiResponse({ status: 400, description: 'UserLocation already exists', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async sendChatRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateUserLocationDto,) {
        // dto.user_id = user.userId;
        const result = await this.userLocationService.create(dto);
        return new BaseResponseDto(result, 'UserLocation saved successfully');
    }

    @Patch(':id')
    @ApiOperation({ summary: 'update userlocation' })
    @ApiResponse({ status: 201, description: 'UserLocation update successfully', type: BaseResponseDto, })
    @ApiResponse({ status: 400, description: 'UserLocation already exists', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async acceptChatRequest(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserLocationDto,) {
        const result = await this.userLocationService.update(id, dto);
        return new BaseResponseDto(result, `UserLocation updated successfully`);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'delete userlocation' })
    @ApiResponse({ status: 200, description: 'UserLocation delete successfully', type: BaseResponseDto, })
    async deleteUserLocation(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.userLocationService.remove(id);
        return new BaseResponseDto(result, `UserLocation deleted successfully`);
    }

    @Delete(':id/permanent')
    @ApiOperation({ summary: 'delete userlocation permanently' })
    async deleteUserLocationPermanently(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.userLocationService.permanentRemove(id);
        return new BaseResponseDto(result, `UserLocation deleted permanently`);
    }

    @Post(':id/restore')
    @ApiOperation({ summary: 'restore userlocation' })
    async restoreUserLocation(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.userLocationService.restore(id);
        return new BaseResponseDto(result, `UserLocation restored successfully`);
    }
}

