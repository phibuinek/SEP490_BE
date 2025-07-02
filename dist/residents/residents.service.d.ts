import { Model } from 'mongoose';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Resident, ResidentDocument } from './schemas/resident.schema';
import { UsersService } from '../users/users.service';
export declare class ResidentsService {
    private residentModel;
    private readonly usersService;
    constructor(residentModel: Model<ResidentDocument>, usersService: UsersService);
    create(createResidentDto: CreateResidentDto): Promise<Resident>;
    findAll(): Promise<Resident[]>;
    findOne(id: string): Promise<Resident>;
    update(id: string, updateResidentDto: UpdateResidentDto): Promise<Resident>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}
