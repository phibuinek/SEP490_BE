import { UserRole, Relationship } from '../schemas/user.schema';
export declare class CreateUserDto {
    username: string;
    email: string;
    password: string;
    full_name: string;
    phone: string;
    role: UserRole;
    avatar?: string;
    is_super_admin?: boolean;
    position?: string;
    qualification?: string;
    join_date?: Date;
    relationship?: Relationship;
    residents?: string[];
    address?: string;
    notes?: string;
}
