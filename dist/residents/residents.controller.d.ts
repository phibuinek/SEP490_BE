import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
export declare class ResidentsController {
    private readonly residentsService;
    constructor(residentsService: ResidentsService);
    create(createResidentDto: CreateResidentDto): Promise<import("./schemas/resident.schema").Resident>;
    findAll(): Promise<import("./schemas/resident.schema").Resident[]>;
    findOne(id: string): Promise<import("./schemas/resident.schema").Resident>;
    update(id: string, updateResidentDto: UpdateResidentDto): Promise<import("./schemas/resident.schema").Resident>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}
