import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserLocation } from './entities/user-location.entity';
import { CreateUserLocationDto } from './dto/create-user-location.dto';
import { FilterUserLocationDto } from './dto/filter-user-location.dto';
import { UpdateUserLocationDto } from './dto/update-user-location.dto';

@Injectable()
export class UserLocationService {
    constructor(
        @InjectRepository(UserLocation)
        private userlocationRepository: Repository<UserLocation>,
    ) { }

    async create(userlocationDto: CreateUserLocationDto) {
        const userlocation = this.userlocationRepository.create({
            ...userlocationDto,
            location: {
                type: "Point",
                coordinates: [userlocationDto.longitude, userlocationDto.latitude],
            },
        });

        try {
            return await this.userlocationRepository.save(userlocation);
        } catch (error) {
            if (error instanceof QueryFailedError) {
                const driverError = error.driverError as { code?: string };

                if (driverError?.code === '23503') {
                    throw new BadRequestException('User not found');
                }
            }

            throw new InternalServerErrorException('Failed to save user location');
        }
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterUserLocationDto>,
    ): Promise<PaginatedResponseDto<UserLocation>> {
        const { page = 1, limit = 20 } = paginationDto;
        const skip = (page - 1) * limit;
        const hasAreaRangeFilter =
            !!filters?.user_id && filters?.area_in_length_km !== undefined;

        const queryBuilder = this.userlocationRepository
            .createQueryBuilder('userlocation')
            .leftJoinAndSelect('userlocation.users', 'users')
            .skip(skip)
            .take(limit);

        if (filters?.user_id && !hasAreaRangeFilter) {
            queryBuilder.andWhere('userlocation.user_id = :user_id', {
                user_id: filters.user_id,
            });
        }
        if (filters?.area) {
            queryBuilder.andWhere('userlocation.area ILIKE :area', {
                area: `%${filters.area}%`,
            });
        }
        if (filters?.city) {
            queryBuilder.andWhere('userlocation.city ILIKE :city', {
                city: `%${filters.city}%`,
            });
        }
        if (filters?.state) {
            queryBuilder.andWhere('userlocation.state ILIKE :state', {
                state: `%${filters.state}%`,
            });
        }
        if (filters?.country) {
            queryBuilder.andWhere('userlocation.country ILIKE :country', {
                country: `%${filters.country}%`,
            });
        }
        if (hasAreaRangeFilter) {
            const centerLocation = await this.userlocationRepository.findOne({
                where: { user_id: filters.user_id },
                order: { created_at: 'DESC' },
            });

            if (!centerLocation) {
                return {
                    items: [],
                    meta: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false,
                    },
                };
            }

            const radiusInMeters = Number(filters.area_in_length_km) * 1000;

            queryBuilder
                .addSelect(
                    `ST_Distance(
                            userlocation.location,
                            ST_SetSRID(ST_MakePoint(:longitude,:latitude),4326)::geography
                        )`,
                    'distance'
                )
                .andWhere(
                    `ST_DWithin(
                            userlocation.location,
                            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                            :radiusInMeters
                        )`,
                    {
                        longitude: centerLocation.longitude,
                        latitude: centerLocation.latitude,
                        radiusInMeters,
                    }
                )
                .orderBy('distance', 'ASC');
        }


        const [items, total] = await queryBuilder.getManyAndCount();

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            },
        };
    }

    findOne(id: string) {
        return this.userlocationRepository.findOne({
            where: { id },
            relations: ['users'],
            withDeleted: false, // Only get non-deleted users
        });
    }

    update(id: string, dto: UpdateUserLocationDto) {
        dto.location = {
            type: "Point",
            coordinates: [dto.longitude, dto.latitude],
        };
        return this.userlocationRepository.update(id, dto);
    }

    remove(id: string) {
        return this.userlocationRepository.softDelete(id);
    }

    permanentRemove(id: string) {
        return this.userlocationRepository.delete(id);
    }

    restore(id: string) {
        return this.userlocationRepository.restore(id);
    }
}

