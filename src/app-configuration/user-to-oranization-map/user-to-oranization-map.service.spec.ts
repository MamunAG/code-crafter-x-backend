import { RolesEnum } from 'src/common/enums/role.enum';
import { Organization } from '../organization/entity/organization.entity';
import { UserToOranizationMapService } from './user-to-oranization-map.service';

describe('UserToOranizationMapService effective organizations', () => {
  const organizationRepository = { find: jest.fn() };
  const service = new UserToOranizationMapService(
    {} as never,
    {} as never,
    {} as never,
    organizationRepository as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns active and inactive organizations for a global admin without mapping checks', async () => {
    organizationRepository.find.mockResolvedValueOnce([
      { id: 'organization-1', name: 'One', isActive: true },
      { id: 'organization-2', name: 'Two', isActive: false },
    ] as Organization[]);

    const result = await service.findOrganizationsForCurrentUser({
      userId: 'admin-user',
      email: 'admin@example.com',
      role: RolesEnum.admin,
    });

    expect(result).toEqual([
      { id: 'organization-1', name: 'One', isActive: true, isDefault: false },
      { id: 'organization-2', name: 'Two', isActive: false, isDefault: false },
    ]);
    expect(organizationRepository.find).toHaveBeenCalledWith({
      relations: { created_by_user: true, updated_by_user: true },
      order: { created_at: 'DESC' },
    });
  });

  it('uses mapped organizations for a regular user', async () => {
    const mappedOrganizations = [{ id: 'organization-1', name: 'Mapped', isDefault: true }] as Organization[];
    const mappedSpy = jest.spyOn(service, 'findOrganizationsByUser').mockResolvedValueOnce(mappedOrganizations as never);

    const result = await service.findOrganizationsForCurrentUser({
      userId: 'regular-user',
      email: 'user@example.com',
      role: RolesEnum.user,
    });

    expect(result).toBe(mappedOrganizations);
    expect(mappedSpy).toHaveBeenCalledWith('regular-user');
    expect(organizationRepository.find).not.toHaveBeenCalled();
  });
});
