import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ContactService } from './contact.service';
import { FilterContactDto } from './dto/filter-contact.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';

@ApiTags('Contact')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/contact')
export class ContactController {
    constructor(
        private readonly contactService: ContactService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all', description: 'Retrieve all items', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getIncomingRequests(@Query() filters: FilterContactDto) {
        const { page, limit, ...contactsFilters } = filters;
        const pagination = { page, limit };
        const contacts = await this.contactService.findAll(pagination, contactsFilters);
        return new BaseResponseDto(contacts, 'Contacts retrieved successfully');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get by id', description: 'Retrive specific item', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getOutgoingRequests(@Param('id', new ParseUUIDPipe()) id: string) {
        const contacts = await this.contactService.findOne(id);
        return new BaseResponseDto(contacts, 'Contacts retrieved successfully');
    }

    @Post()
    @ApiOperation({ summary: 'save item' })
    @ApiResponse({ status: 201, description: 'Item save successfully', type: BaseResponseDto, })
    @ApiResponse({ status: 400, description: 'Item already exists', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async sendChatRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateContactDto,) {
        dto.created_by_id = user.userId;
        const result = await this.contactService.create(dto);
        return new BaseResponseDto(result, 'Contact saved successfully');
    }

    @Patch(':id')
    @ApiOperation({ summary: 'update item' })
    @ApiResponse({ status: 201, description: 'Item update successfully', type: BaseResponseDto, })
    @ApiResponse({ status: 400, description: 'Item already exists', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async acceptChatRequest(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateContactDto,) {
        const result = await this.contactService.update(id, dto);
        return new BaseResponseDto(result, `Contact updated successfully`);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'delete item' })
    @ApiResponse({ status: 200, description: 'Item delete successfully', type: BaseResponseDto, })
    async deleteContact(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.contactService.remove(id);
        return new BaseResponseDto(result, `Contact deleted successfully`);
    }

    @Delete(':id/permanent')
    @ApiOperation({ summary: 'delete item permanently' })
    async deleteContactPermanently(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.contactService.permanentRemove(id);
        return new BaseResponseDto(result, `Contact deleted permanently`);
    }

    @Post(':id/restore')
    @ApiOperation({ summary: 'restore item' })
    async restoreContact(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.contactService.restore(id);
        return new BaseResponseDto(result, `Contact restored successfully`);
    }
}

