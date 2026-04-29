import { SetMetadata } from '@nestjs/common';

export const MENU_ACCESS_KEY = 'menu_access';

export type MenuAccessAction = 'canView' | 'canCreate' | 'canUpdate' | 'canDelete';

export type MenuAccessMetadata = {
  menuName: string;
  action: MenuAccessAction;
};

export const MenuAccess = (menuName: string, action: MenuAccessAction) =>
  SetMetadata(MENU_ACCESS_KEY, { menuName, action } satisfies MenuAccessMetadata);
