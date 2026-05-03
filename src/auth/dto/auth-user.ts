import { RolesEnum } from "src/common/enums/role.enum";

export default interface AuthUser {
    userId: string;
    email: string;
    role: RolesEnum;
}
