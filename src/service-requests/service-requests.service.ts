import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ServiceRequest,
  ServiceRequestDocument,
  ServiceRequestStatus,
} from './service-request.schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectModel(ServiceRequest.name)
    private serviceRequestModel: Model<ServiceRequestDocument>,
  ) {}

  async create(dto: CreateServiceRequestDto): Promise<ServiceRequest> {
    const created = new this.serviceRequestModel({
      ...dto,
      status: ServiceRequestStatus.PENDING,
    });
    return created.save();
  }

  async findAll(status?: string): Promise<ServiceRequest[]> {
    const filter = status ? { status } : {};
    return this.serviceRequestModel.find(filter).exec();
  }

  async approve(id: string): Promise<ServiceRequest> {
    const req = await this.serviceRequestModel
      .findByIdAndUpdate(
        id,
        { status: ServiceRequestStatus.APPROVED },
        { new: true },
      )
      .exec();
    if (!req) throw new NotFoundException('ServiceRequest not found');
    return req;
  }

  async reject(id: string): Promise<ServiceRequest> {
    const req = await this.serviceRequestModel
      .findByIdAndUpdate(
        id,
        { status: ServiceRequestStatus.REJECTED },
        { new: true },
      )
      .exec();
    if (!req) throw new NotFoundException('ServiceRequest not found');
    return req;
  }
}
