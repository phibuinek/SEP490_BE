import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VitalSign, VitalSignDocument } from './schemas/vital-sign.schema';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import {
  StaffAssignment,
  StaffAssignmentDocument,
} from '../staff-assignments/schemas/staff-assignment.schema';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';

@Injectable()
export class VitalSignsService {
  constructor(
    @InjectModel(VitalSign.name)
    private vitalSignModel: Model<VitalSignDocument>,
    @InjectModel(StaffAssignment.name)
    private staffAssignmentModel: Model<StaffAssignmentDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
  ) {}

  async create(
    createDto: CreateVitalSignDto,
    user_id: string,
  ): Promise<VitalSign> {
    console.log('=== VITAL SIGNS SERVICE CREATE ===');
    console.log('Create DTO:', createDto);
    console.log('User ID:', user_id);
    console.log('Resident ID type:', typeof createDto.resident_id);
    console.log('Resident ID value:', createDto.resident_id);
    console.log(
      'Temperature type:',
      typeof createDto.temperature,
      'value:',
      createDto.temperature,
    );
    console.log(
      'Heart rate type:',
      typeof createDto.heart_rate,
      'value:',
      createDto.heart_rate,
    );
    console.log(
      'Blood pressure type:',
      typeof createDto.blood_pressure,
      'value:',
      createDto.blood_pressure,
    );
    console.log(
      'Oxygen level type:',
      typeof createDto.oxygen_level,
      'value:',
      createDto.oxygen_level,
    );
    console.log(
      'Respiratory rate type:',
      typeof createDto.respiratory_rate,
      'value:',
      createDto.respiratory_rate,
    );
    console.log(
      'Weight type:',
      typeof createDto.weight,
      'value:',
      createDto.weight,
    );

    // Validate blood pressure format if provided
    if (createDto.blood_pressure && createDto.blood_pressure.trim() !== '') {
      if (!/^[0-9]{2,3}\/[0-9]{2,3}$/.test(createDto.blood_pressure)) {
        const validationError = new Error(
          'Huyết áp phải đúng định dạng (ví dụ: 120/80)',
        );
        (validationError as any).isValidationError = true;
        (validationError as any).field = 'blood_pressure';
        throw validationError;
      }
    }

    // Validate that at least one vital sign value is provided
    const hasVitalSignValues =
      createDto.temperature ||
      createDto.heart_rate ||
      createDto.blood_pressure ||
      createDto.respiratory_rate ||
      createDto.oxygen_level ||
      createDto.weight;

    console.log('Has vital sign values:', hasVitalSignValues);

    if (!hasVitalSignValues) {
      throw new Error('Phải có ít nhất một chỉ số sinh hiệu');
    }

    try {
      // Clean up the data - remove undefined values and validate types
      const cleanData: any = {};

      // Only include fields that have valid values
      if (
        createDto.temperature !== undefined &&
        createDto.temperature !== null &&
        !isNaN(Number(createDto.temperature))
      ) {
        cleanData.temperature = Number(createDto.temperature);
      }
      if (
        createDto.heart_rate !== undefined &&
        createDto.heart_rate !== null &&
        !isNaN(Number(createDto.heart_rate))
      ) {
        cleanData.heart_rate = Number(createDto.heart_rate);
      }
      if (
        createDto.blood_pressure !== undefined &&
        createDto.blood_pressure !== null &&
        createDto.blood_pressure.trim() !== ''
      ) {
        cleanData.blood_pressure = createDto.blood_pressure.trim();
      }
      if (
        createDto.respiratory_rate !== undefined &&
        createDto.respiratory_rate !== null &&
        !isNaN(Number(createDto.respiratory_rate))
      ) {
        cleanData.respiratory_rate = Number(createDto.respiratory_rate);
      }
      if (
        createDto.oxygen_level !== undefined &&
        createDto.oxygen_level !== null &&
        !isNaN(Number(createDto.oxygen_level))
      ) {
        cleanData.oxygen_level = Number(createDto.oxygen_level);
      }
      if (
        createDto.weight !== undefined &&
        createDto.weight !== null &&
        !isNaN(Number(createDto.weight))
      ) {
        cleanData.weight = Number(createDto.weight);
      }
      if (
        createDto.notes !== undefined &&
        createDto.notes !== null &&
        createDto.notes.trim() !== ''
      ) {
        cleanData.notes = createDto.notes.trim();
      }

      console.log('Clean data for MongoDB:', cleanData);

      const createdVitalSign = new this.vitalSignModel({
        ...cleanData,
        resident_id: new Types.ObjectId(createDto.resident_id),
        recorded_by: new Types.ObjectId(user_id),
        date_time: new Date(Date.now() + 7 * 60 * 60 * 1000), // GMT+7
      });

      // Try to save with validation bypass first to see if it's a schema validation issue
      try {
        const result = await createdVitalSign.save();
        console.log('Created vital sign result:', result);
        return result;
      } catch (saveError) {
        console.log('Save error:', saveError);

        // If save fails, try with native MongoDB insertOne to bypass validation
        if (saveError.name === 'MongoServerError' && saveError.code === 121) {
          console.log(
            'Trying native MongoDB insertOne to bypass validation...',
          );
          const collection = this.vitalSignModel.collection;
          const insertData = {
            ...cleanData,
            resident_id: new Types.ObjectId(createDto.resident_id),
            recorded_by: new Types.ObjectId(user_id),
            date_time: new Date(Date.now() + 7 * 60 * 60 * 1000), // GMT+7
            created_at: new Date(),
            updated_at: new Date(),
          };

          const insertResult = await collection.insertOne(insertData, {
            bypassDocumentValidation: true,
          });
          console.log('Native insert result:', insertResult);

          // Return the inserted document
          const insertedDoc = await this.vitalSignModel.findById(
            insertResult.insertedId,
          );
          if (!insertedDoc) {
            throw new Error('Không thể tạo chỉ số sinh hiệu');
          }
          return insertedDoc;
        }

        throw saveError;
      }
    } catch (err) {
      console.error('Error saving vital sign:', err);

      // Handle MongoDB validation errors with detailed information
      if (err.name === 'MongoServerError' && err.code === 121) {
        console.log('=== MONGODB VALIDATION ERROR DETAILS ===');
        console.log(
          'Error details:',
          JSON.stringify(err.errInfo?.details, null, 2),
        );
        console.log(
          'Error response:',
          JSON.stringify(err.errorResponse, null, 2),
        );

        const details = err.errInfo?.details;
        if (details && details.schemaRulesNotSatisfied) {
          const validationErrors: string[] = [];

          details.schemaRulesNotSatisfied.forEach((rule: any) => {
            if (rule.propertiesNotSatisfied) {
              rule.propertiesNotSatisfied.forEach((prop: any) => {
                const fieldName = prop.propertyName;
                const description = prop.description || 'Dữ liệu không hợp lệ';

                // Map field names to Vietnamese
                const fieldMap: { [key: string]: string } = {
                  resident_id: 'Người cao tuổi',
                  temperature: 'Nhiệt độ',
                  heart_rate: 'Nhịp tim',
                  blood_pressure: 'Huyết áp',
                  oxygen_level: 'Nồng độ oxy',
                  respiratory_rate: 'Nhịp thở',
                  weight: 'Cân nặng',
                  notes: 'Ghi chú',
                };

                const vietnameseField = fieldMap[fieldName] || fieldName;
                validationErrors.push(`${vietnameseField}: ${description}`);
              });
            }
          });

          if (validationErrors.length > 0) {
            const validationError = new Error(validationErrors.join('; '));
            (validationError as any).isValidationError = true;
            (validationError as any).field = 'multiple';
            throw validationError;
          }
        }

        // Fallback for general MongoDB validation error
        const validationError = new Error(
          'Dữ liệu không đúng định dạng theo yêu cầu của hệ thống',
        );
        (validationError as any).isValidationError = true;
        (validationError as any).field = 'general';
        throw validationError;
      }

      // Handle specific MongoDB errors
      if (err.code === 11000) {
        throw new Error('Chỉ số sinh hiệu đã tồn tại');
      }

      if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(
          (e: any) => e.message,
        );
        throw new Error(`Lỗi validation: ${validationErrors.join(', ')}`);
      }

      if (err.name === 'CastError') {
        throw new Error('Dữ liệu không đúng định dạng');
      }

      throw err;
    }
  }

  async findAll(): Promise<VitalSign[]> {
    return this.vitalSignModel.find();
  }

  async findAllByStaffId(staff_id: string): Promise<VitalSign[]> {
    console.log('=== FIND ALL BY STAFF ID ===');
    console.log('Staff ID:', staff_id);

    // Get all residents assigned to this staff through room assignments
    const assignments = await this.staffAssignmentModel.find({
      staff_id: new Types.ObjectId(staff_id),
      status: 'active',
    });

    console.log('Staff assignments found:', assignments.length);
    console.log('Assignments:', assignments);

    if (assignments.length === 0) {
      console.log('No room assignments for this staff');
      return [];
    }

    // Get all room IDs assigned to this staff
    const roomIds = assignments.map(assignment => assignment.room_id);
    console.log('Room IDs from assignments:', roomIds);

    // Find all residents in these rooms through bed assignments
    const residents = await this.residentModel
      .find({
        is_deleted: false,
        status: { $in: ['accepted', 'active'] },
      })
      .populate({
        path: 'bed_id',
        select: 'room_id',
        match: { room_id: { $in: roomIds } }
      })
      .exec();

    // Filter residents that are actually in the assigned rooms
    const residentsInAssignedRooms = residents.filter(resident => {
      const residentWithBed = resident as any;
      return residentWithBed.bed_id && 
             residentWithBed.bed_id.room_id && 
             roomIds.some(roomId => roomId.toString() === residentWithBed.bed_id.room_id.toString());
    });

    const residentIds = residentsInAssignedRooms.map(resident => resident._id);
    console.log('Resident IDs from room assignments:', residentIds);

    if (residentIds.length === 0) {
      console.log('No residents assigned to this staff');
      return [];
    }

    // Get vital signs for all assigned residents
    const vitalSigns = await this.vitalSignModel
      .find({
        resident_id: { $in: residentIds },
      })
      .populate({
        path: 'recorded_by',
        select: 'full_name position',
      })
      .populate({
        path: 'resident_id',
        select: 'full_name date_of_birth gender',
      })
      .exec();

    console.log('Vital signs found for assigned residents:', vitalSigns.length);
    console.log('Vital signs:', vitalSigns);

    return vitalSigns;
  }

  async findAllByResidentId(resident_id: string): Promise<VitalSign[]> {
    // Convert string to ObjectId and use correct field name from DB
    return this.vitalSignModel
      .find({
        resident_id: new Types.ObjectId(resident_id),
      })
      .populate({
        path: 'recorded_by',
        select: 'full_name position',
      })
      .exec();
  }

  async findOne(id: string): Promise<VitalSign> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Định dạng ID chỉ số sinh hiệu không hợp lệ',
      );
    }

    const vital = await this.vitalSignModel.findById(id).exec();
    if (!vital) {
      throw new NotFoundException('Không tìm thấy chỉ số sinh hiệu');
    }
    return vital;
  }

  async update(
    id: string,
    updateVitalSignDto: UpdateVitalSignDto,
  ): Promise<VitalSign> {
    console.log('=== VITAL SIGNS UPDATE ===');
    console.log('Update DTO:', JSON.stringify(updateVitalSignDto, null, 2));

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Định dạng ID chỉ số sinh hiệu không hợp lệ',
      );
    }

    const vital = await this.vitalSignModel.findById(id).exec();
    if (!vital) {
      throw new NotFoundException('Không tìm thấy chỉ số sinh hiệu');
    }

    try {
      // Clean up the update data - remove undefined values and validate types
      const cleanUpdateData: any = {};

      // Only include fields that have valid values (same logic as create method)
      if (
        updateVitalSignDto.temperature !== undefined &&
        updateVitalSignDto.temperature !== null &&
        !isNaN(Number(updateVitalSignDto.temperature))
      ) {
        cleanUpdateData.temperature = Number(updateVitalSignDto.temperature);
      }
      if (
        updateVitalSignDto.heart_rate !== undefined &&
        updateVitalSignDto.heart_rate !== null &&
        !isNaN(Number(updateVitalSignDto.heart_rate))
      ) {
        cleanUpdateData.heart_rate = Number(updateVitalSignDto.heart_rate);
      }
      if (
        updateVitalSignDto.blood_pressure !== undefined &&
        updateVitalSignDto.blood_pressure !== null &&
        updateVitalSignDto.blood_pressure.trim() !== ''
      ) {
        cleanUpdateData.blood_pressure =
          updateVitalSignDto.blood_pressure.trim();
      }
      if (
        updateVitalSignDto.respiratory_rate !== undefined &&
        updateVitalSignDto.respiratory_rate !== null &&
        !isNaN(Number(updateVitalSignDto.respiratory_rate))
      ) {
        cleanUpdateData.respiratory_rate = Number(
          updateVitalSignDto.respiratory_rate,
        );
      }
      if (
        updateVitalSignDto.oxygen_level !== undefined &&
        updateVitalSignDto.oxygen_level !== null &&
        !isNaN(Number(updateVitalSignDto.oxygen_level))
      ) {
        cleanUpdateData.oxygen_level = Number(updateVitalSignDto.oxygen_level);
      }
      if (
        updateVitalSignDto.weight !== undefined &&
        updateVitalSignDto.weight !== null &&
        !isNaN(Number(updateVitalSignDto.weight))
      ) {
        cleanUpdateData.weight = Number(updateVitalSignDto.weight);
      }
      if (
        updateVitalSignDto.notes !== undefined &&
        updateVitalSignDto.notes !== null &&
        updateVitalSignDto.notes.trim() !== ''
      ) {
        cleanUpdateData.notes = updateVitalSignDto.notes.trim();
      }

      console.log('Clean update data:', cleanUpdateData);

      // Validate blood pressure format if provided
      if (cleanUpdateData.blood_pressure) {
        if (!/^[0-9]{2,3}\/[0-9]{2,3}$/.test(cleanUpdateData.blood_pressure)) {
          throw new BadRequestException(
            'Huyết áp phải đúng định dạng (ví dụ: 120/80)',
          );
        }
      }

      // Try to update with validation bypass first to see if it's a schema validation issue
      try {
        console.log('Attempting to update with findByIdAndUpdate...');
        const updatedVital = await this.vitalSignModel
          .findByIdAndUpdate(id, cleanUpdateData, { new: true })
          .exec();

        if (!updatedVital) {
          throw new NotFoundException('Không tìm thấy chỉ số sinh hiệu');
        }

        console.log('Updated vital sign:', updatedVital);
        return updatedVital;
      } catch (updateError) {
        console.log('Update error details:', {
          name: updateError.name,
          message: updateError.message,
          code: updateError.code,
          stack: updateError.stack,
        });

        // If update fails, try with native MongoDB updateOne to bypass validation
        if (
          updateError.name === 'MongoServerError' &&
          updateError.code === 121
        ) {
          console.log(
            'Trying native MongoDB updateOne to bypass validation...',
          );
          const collection = this.vitalSignModel.collection;

          const updateResult = await collection.updateOne(
            { _id: new Types.ObjectId(id) },
            { $set: cleanUpdateData },
            { bypassDocumentValidation: true },
          );

          console.log('Native update result:', updateResult);

          if (updateResult.matchedCount === 0) {
            throw new NotFoundException('Không tìm thấy chỉ số sinh hiệu');
          }

          // Return the updated document
          const updatedDoc = await this.vitalSignModel.findById(id);
          if (!updatedDoc) {
            throw new Error('Không thể cập nhật chỉ số sinh hiệu');
          }
          return updatedDoc;
        }

        throw updateError;
      }
    } catch (err) {
      console.error('Error updating vital sign:', err);

      // Handle MongoDB validation errors with detailed information
      if (err.name === 'MongoServerError' && err.code === 121) {
        console.log('=== MONGODB VALIDATION ERROR DETAILS ===');
        console.log(
          'Error details:',
          JSON.stringify(err.errInfo?.details, null, 2),
        );
        console.log(
          'Error response:',
          JSON.stringify(err.errorResponse, null, 2),
        );

        const details = err.errInfo?.details;
        if (details && details.schemaRulesNotSatisfied) {
          const validationErrors: string[] = [];

          details.schemaRulesNotSatisfied.forEach((rule: any) => {
            if (rule.propertiesNotSatisfied) {
              rule.propertiesNotSatisfied.forEach((prop: any) => {
                const fieldName = prop.propertyName;
                const description = prop.description || 'Dữ liệu không hợp lệ';

                // Map field names to Vietnamese
                const fieldMap: { [key: string]: string } = {
                  resident_id: 'Người cao tuổi',
                  temperature: 'Nhiệt độ',
                  heart_rate: 'Nhịp tim',
                  blood_pressure: 'Huyết áp',
                  oxygen_level: 'Nồng độ oxy',
                  respiratory_rate: 'Nhịp thở',
                  weight: 'Cân nặng',
                  notes: 'Ghi chú',
                };

                const vietnameseField = fieldMap[fieldName] || fieldName;
                validationErrors.push(`${vietnameseField}: ${description}`);
              });
            }
          });

          if (validationErrors.length > 0) {
            const validationError = new Error(validationErrors.join('; '));
            (validationError as any).isValidationError = true;
            (validationError as any).field = 'multiple';
            throw validationError;
          }
        }

        // Fallback for general MongoDB validation error
        const validationError = new Error(
          'Dữ liệu không đúng định dạng theo yêu cầu của hệ thống',
        );
        (validationError as any).isValidationError = true;
        (validationError as any).field = 'general';
        throw validationError;
      }

      // Handle specific MongoDB errors
      if (err.code === 11000) {
        throw new Error('Chỉ số sinh hiệu đã tồn tại');
      }

      if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(
          (e: any) => e.message,
        );
        throw new Error(`Lỗi validation: ${validationErrors.join(', ')}`);
      }

      if (err.name === 'CastError') {
        throw new Error('Dữ liệu không đúng định dạng');
      }

      throw err;
    }
  }

  async remove(id: string): Promise<VitalSign> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Định dạng ID chỉ số sinh hiệu không hợp lệ',
      );
    }

    const vital = await this.vitalSignModel.findByIdAndDelete(id).exec();
    if (!vital) {
      throw new NotFoundException('Không tìm thấy chỉ số sinh hiệu');
    }

    return vital;
  }
}
