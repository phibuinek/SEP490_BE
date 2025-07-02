import { Document, Schema as MongooseSchema } from 'mongoose';
export declare enum UserRole {
    ADMIN = "admin",
    STAFF = "staff",
    FAMILY = "family"
}
export declare enum Relationship {
    SON = "con trai",
    DAUGHTER = "con g\u00E1i",
    GRANDSON = "ch\u00E1u trai",
    GRANDDAUGHTER = "ch\u00E1u g\u00E1i",
    SIBLING = "anh em",
    SPOUSE = "v\u1EE3/ch\u1ED3ng",
    OTHER = "kh\u00E1c"
}
export type UserDocument = User & Document;
export declare class User {
    full_name: string;
    email: string;
    phone: string;
    username: string;
    password: string;
    avatar: string | null;
    role: UserRole;
    is_super_admin?: boolean;
    position?: string;
    qualification?: string;
    join_date?: Date;
    relationship?: Relationship;
    residents?: MongooseSchema.Types.ObjectId[];
    address?: string;
    notes?: string;
}
export declare const UserSchema: MongooseSchema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
