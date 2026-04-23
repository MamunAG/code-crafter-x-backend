/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { DeleteAccount } from './entities/delete-account.entity';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { Cron } from '@nestjs/schedule';
import { UpdateProfileBirthDateGenderDto } from './dto/update-profile-birth-date-gender.dto';
import { UpdateProfilePhoneNoDto } from './dto/update-profile-phone-number.dto';
import { UpdateProfileRollaDto } from './dto/update-profile-rolla.dto';
import { UpdatProfileUserNameDto } from './dto/update-profile-userName.dto';
import { UpdatProfileLanguageDto } from './dto/update-profile-language.dto';
import { UpdatProfileSettingsStatusChangeDto } from './dto/update-profile-settings-status-change.dto';
import { UserLocation } from 'src/user-location/entities/user-location.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserLocation)
    private userLocationRepository: Repository<UserLocation>,

    @InjectRepository(DeleteAccount)
    private deleteAccountRepository: Repository<DeleteAccount>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    // Hash the password before saving
    const existingUser = await this.findByEmailOrUserName(createUserDto.email);
    console.log(existingUser);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    // const existingUserByUserName = await this.findByEmailOrUserName(createUserDto.name);
    // if (existingUserByUserName) {
    //   throw new BadRequestException('Username already exists');
    // }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user DTO with hashed password
    const userWithHashedPassword = {
      ...createUserDto,
      password: hashedPassword,
    };

    const user = this.userRepository.create(userWithHashedPassword);
    return this.userRepository.save(user);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterUserDto>,
  ): Promise<PaginatedResponseDto<User>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile_pic', 'profile_pic')
      .skip(skip)
      .take(limit)
      .orderBy('user.name', 'DESC');

    // Apply filter if phone no avl
    if (filters?.phone_no) {
      queryBuilder.andWhere('user.phone_no = :phone_no', {
        phone_no: filters.phone_no,
      });
    }

    // Apply status filter if provided
    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: filters.status,
      });
    }

    // Apply role filter if provided
    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', {
        role: filters.role,
      });
    }

    // Apply email filter if provided
    if (filters?.email) {
      queryBuilder.andWhere('user.email = :email', {
        email: filters.email,
      });
    }

    // Apply name filter if provided
    if (filters?.name) {
      queryBuilder.andWhere('user.name ILIKE :name', {
        name: filters.name,
      });
    }


    const [items, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // items.forEach(item => {
    //   item.country: { id: item.country_id, name: item?.countries?.name }
    // });

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

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile_pic'],
      withDeleted: false, // Only get non-deleted users
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const UserCurrentLocation = await this.userLocationRepository.findOne({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });

    return { ...user, location: UserCurrentLocation, form: 2025, likes: 156, faves: 46, admieres: 1875 };
  }

  async findNearestLocations(userId: string) {
    const currentUserLocation = await this.userLocationRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      withDeleted: true,
    });

    if (!currentUserLocation) {
      throw new BadRequestException('Logged in user location not found');
    }

    const queryBuilder = this.userLocationRepository
      .createQueryBuilder('userLocation')
      .withDeleted()
      .where('userLocation.user_id != :userId', { userId })
      .andWhere(`userLocation.id = (
          SELECT ul.id
          FROM rillo_users_location ul
          WHERE ul.user_id = "userLocation".user_id
          ORDER BY ul.created_at DESC, ul.id DESC
          LIMIT 1
        )`)
      .addSelect(
        `ST_Distance(
          userLocation.location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        ) / 1000`,
        'distance_km',
      )
      .orderBy('distance_km', 'ASC')
      .setParameters({
        longitude: currentUserLocation.longitude,
        latitude: currentUserLocation.latitude,
      })
      .take(5);

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((location, index) => ({
      ...location,
      distance_km: Number(raw[index].distance_km) || 0,
    }));
  }

  findByEmailOrUserName(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .orWhere('user.user_name = :user_name', { user_name: email })
      .getOne();
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }
  updateBirthDateGander(id: string, updateUserDto: UpdateProfileBirthDateGenderDto) {
    return this.userRepository.update(id, updateUserDto);
  }
  updatePhoneNumber(id: string, updateUserDto: UpdateProfilePhoneNoDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  updateRolla(id: string, updateUserDto: UpdateProfileRollaDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  updateUserName(id: string, updateUserDto: UpdatProfileUserNameDto) {
    return this.userRepository.update(id, updateUserDto);
  }
  updateLanguage(id: string, updateUserDto: UpdatProfileLanguageDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: string) {
    return this.userRepository.softDelete(id);
  }

  // Method to permanently delete a user (for admin purposes)
  permanentRemove(id: string) {
    return this.userRepository.delete(id);
  }

  // Method to restore a soft-deleted user
  restore(id: string) {
    return this.userRepository.restore(id);
  }

  getRoles(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async deleteAccount(user_id: string, dto: DeleteAccountDto) {
    dto.user_id = user_id;
    await this.userRepository.softDelete(user_id);

    const deleteAccount = this.deleteAccountRepository.create(dto);
    return this.deleteAccountRepository.save(deleteAccount);
  }

  async retriveAccount(user_id: string) {
    await this.userRepository.restore(user_id);
    return await this.deleteAccountRepository.delete({ user_id });
  }

  async settingsStatusChange(user_id: string, dto: UpdatProfileSettingsStatusChangeDto) {
    await this.userRepository.update(user_id, {
      [dto.setting]: dto.enable,
    });
  }


  @Cron('*/5 * * * *')
  async deactivateUserAccountAfterSpecificTime() {
    // Permanently remove soft-deleted users after 14 days.
    console.log('Delete account checking start.')
    await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('deleted_at IS NOT NULL')
      .andWhere('deleted_at < :threshold', {
        threshold: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      })
      .execute();
    console.log('Delete account checking end.')
  }

}
