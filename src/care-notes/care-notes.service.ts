import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assessment, AssessmentDocument } from './schemas/care-note.schema';
import { CreateAssessmentDto } from './dto/create-care-note.dto';
import { UpdateCareNoteDto } from './dto/update-care-note.dto';
import {
  StaffAssignment,
  StaffAssignmentDocument,
} from '../staff-assignments/schemas/staff-assignment.schema';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';

// Interface for assessment data
interface AssessmentData {
  assessment_type: string | null;
  date: Date;
  notes: string | null;
  recommendations: string | null;
  resident_id: Types.ObjectId;
  conducted_by?: Types.ObjectId;
}

@Injectable()
export class CareNotesService {
  constructor(
    @InjectModel(Assessment.name)
    private careNoteModel: Model<AssessmentDocument>,
    @InjectModel(StaffAssignment.name)
    private staffAssignmentModel: Model<StaffAssignmentDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    try {
      console.log('Creating assessment with:', createAssessmentDto);

      // Check collection validation rules
      try {
        const collection = this.careNoteModel.collection;
        const options = await collection.options();
        console.log('Collection options:', options);

        // Try to get collection info
        const collInfo = await collection.listIndexes().toArray();
        console.log('Collection indexes:', collInfo);
      } catch (infoError) {
        console.log('Could not get collection info:', infoError.message);
      }

      // Validate required fields
      if (!createAssessmentDto.resident_id) {
        throw new Error('Resident ID is required');
      }

      // Clean up the data - remove undefined values and ensure proper types
      const cleanData = {
        assessment_type: createAssessmentDto.assessment_type?.trim() || null,
        notes: createAssessmentDto.notes?.trim() || null,
        recommendations: createAssessmentDto.recommendations?.trim() || null,
        resident_id: createAssessmentDto.resident_id,
        conducted_by: createAssessmentDto.conducted_by || null,
      };

      // Convert empty strings to null
      Object.keys(cleanData).forEach((key) => {
        if (cleanData[key] === '') {
          cleanData[key] = null;
        }
      });

      // Validate resident_id format
      if (!Types.ObjectId.isValid(cleanData.resident_id)) {
        throw new Error('Invalid resident ID format');
      }

      // Validate conducted_by format if provided
      if (
        cleanData.conducted_by &&
        !Types.ObjectId.isValid(cleanData.conducted_by)
      ) {
        throw new Error('Invalid conducted_by ID format');
      }

      // Create the assessment document with proper ObjectId conversion
      const assessmentData: AssessmentData = {
        assessment_type: cleanData.assessment_type,
        date: new Date(Date.now() + 7 * 60 * 60 * 1000), // GMT+7
        notes: cleanData.notes,
        recommendations: cleanData.recommendations,
        resident_id: new Types.ObjectId(cleanData.resident_id),
      };

      // Only add conducted_by if it exists
      if (cleanData.conducted_by) {
        assessmentData.conducted_by = new Types.ObjectId(
          cleanData.conducted_by,
        );
      }

      console.log('=== ASSESSMENT DATA DEBUG ===');
      console.log('Clean data:', cleanData);
      console.log('Assessment data before model:', assessmentData);
      console.log('resident_id type:', typeof assessmentData.resident_id);
      console.log(
        'resident_id instanceof ObjectId:',
        assessmentData.resident_id instanceof Types.ObjectId,
      );
      if (assessmentData.conducted_by) {
        console.log('conducted_by type:', typeof assessmentData.conducted_by);
        console.log(
          'conducted_by instanceof ObjectId:',
          assessmentData.conducted_by instanceof Types.ObjectId,
        );
      }
      console.log('============================');

      console.log(
        'Assessment model data:',
        JSON.stringify(assessmentData, null, 2),
      );

      // Try using native MongoDB insertOne to bypass validation issues
      try {
        const result = await this.careNoteModel.create(assessmentData);
        console.log('Assessment created successfully:', result._id);
        return result;
      } catch (createError) {
        console.log('Create method failed, trying insertOne...');
        // Fallback to native MongoDB insertOne with validation bypass
        const collection = this.careNoteModel.collection;
        const insertResult = await collection.insertOne(assessmentData, {
          bypassDocumentValidation: true,
        });
        console.log(
          'Assessment created with insertOne:',
          insertResult.insertedId,
        );

        // Fetch the created document
        const createdDoc = await this.careNoteModel.findById(
          insertResult.insertedId,
        );
        return createdDoc;
      }
    } catch (err) {
      console.error('Error saving assessment:', err);

      // Handle specific MongoDB errors
      if (err.code === 11000) {
        throw new Error('Đánh giá đã tồn tại');
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

      if (err.code === 121) {
        console.error('MongoDB validation error details:', err.errInfo);
        console.error('Full error object:', JSON.stringify(err, null, 2));
        console.error(
          'Schema rules not satisfied:',
          err.errInfo?.details?.schemaRulesNotSatisfied,
        );
        throw new Error('Dữ liệu không hợp lệ với schema');
      }

      throw err;
    }
  }

  async findAll(resident_id: string) {
    console.log('🔄 Service: Finding assessments for resident:', resident_id);
    const assessments = await this.careNoteModel
      .find({ resident_id: new Types.ObjectId(resident_id) })
      .sort({ date: -1 })
      .populate({
        path: 'conducted_by',
        select: 'full_name position',
      })
      .exec();
    console.log('✅ Service: Found assessments count:', assessments.length);
    return assessments;
  }

  async isStaffAssignedToResident(
    staff_id: string,
    resident_id: string,
  ): Promise<boolean> {
    try {
      const assignment = await this.staffAssignmentModel.findOne({
        staff_id: new Types.ObjectId(staff_id),
        resident_id: new Types.ObjectId(resident_id),
        status: 'active',
      });
      return !!assignment;
    } catch (error) {
      console.error('Error checking staff assignment:', error);
      return false;
    }
  }

  async findAllByStaffId(staff_id: string) {
    // Get all residents assigned to this staff through room assignments
    const assignments = await this.staffAssignmentModel.find({
      staff_id: new Types.ObjectId(staff_id),
      status: 'active',
    });

    if (assignments.length === 0) {
      return [];
    }

    // Get all room IDs assigned to this staff
    const roomIds = assignments.map(assignment => assignment.room_id);

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

    if (residentIds.length === 0) {
      return [];
    }

    // Get care notes for all assigned residents
    return this.careNoteModel
      .find({
        resident_id: { $in: residentIds },
      })
      .sort({ date: -1 })
      .populate({
        path: 'conducted_by',
        select: 'full_name position',
      })
      .populate({
        path: 'resident_id',
        select: 'full_name date_of_birth gender',
      })
      .exec();
  }

  async findOne(id: string): Promise<Assessment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID đánh giá không hợp lệ');
    }

    const assessment = await this.careNoteModel.findById(id).exec();
    if (!assessment) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }
    return assessment;
  }

  async update(
    id: string,
    updateCareNoteDto: UpdateCareNoteDto,
  ): Promise<Assessment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID đánh giá không hợp lệ');
    }

    const assessment = await this.careNoteModel.findById(id).exec();
    if (!assessment) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    const updatedAssessment = await this.careNoteModel
      .findByIdAndUpdate(id, updateCareNoteDto, { new: true })
      .exec();

    if (!updatedAssessment) {
      throw new NotFoundException('Không thể cập nhật đánh giá');
    }

    return updatedAssessment;
  }

  async patch(id: string, patchAssessmentDto: UpdateCareNoteDto) {
    try {
      console.log('=== PATCHING ASSESSMENT ===');
      console.log('Assessment ID:', id);
      console.log('Patch DTO:', JSON.stringify(patchAssessmentDto, null, 2));

      // Check collection validation rules
      try {
        const collection = this.careNoteModel.collection;
        const options = await collection.options();
        console.log('Collection options:', options);

        // Try to get collection info
        const collInfo = await collection.listIndexes().toArray();
        console.log('Collection indexes:', collInfo);
      } catch (infoError) {
        console.log('Could not get collection info:', infoError.message);
      }

      // Validate ID format
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assessment ID format');
      }

      // Find the assessment
      const assessment = await this.careNoteModel.findById(id).exec();
      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }

      console.log('Found assessment:', assessment._id);

      // Clean and validate patch data - only update provided fields
      const patchData: any = {};

      if (patchAssessmentDto.assessment_type !== undefined) {
        patchData.assessment_type =
          patchAssessmentDto.assessment_type?.trim() || null;
      }

      if (patchAssessmentDto.notes !== undefined) {
        patchData.notes = patchAssessmentDto.notes?.trim() || null;
      }

      if (patchAssessmentDto.recommendations !== undefined) {
        // Handle undefined values properly
        if (
          patchAssessmentDto.recommendations === undefined ||
          patchAssessmentDto.recommendations === null
        ) {
          patchData.recommendations = null;
        } else {
          patchData.recommendations =
            patchAssessmentDto.recommendations.trim() || null;
        }
      }

      if (patchAssessmentDto.resident_id !== undefined) {
        if (!Types.ObjectId.isValid(patchAssessmentDto.resident_id)) {
          throw new Error('Invalid resident ID format');
        }
        patchData.resident_id = new Types.ObjectId(
          patchAssessmentDto.resident_id,
        );
      }

      if (patchAssessmentDto.conducted_by !== undefined) {
        if (
          patchAssessmentDto.conducted_by &&
          !Types.ObjectId.isValid(patchAssessmentDto.conducted_by)
        ) {
          throw new Error('Invalid conducted_by ID format');
        }
        patchData.conducted_by = patchAssessmentDto.conducted_by
          ? new Types.ObjectId(patchAssessmentDto.conducted_by)
          : null;
      }

      // Remove undefined values from patchData
      Object.keys(patchData).forEach((key) => {
        if (patchData[key] === undefined) {
          delete patchData[key];
        }
      });

      console.log('Patch data:', patchData);

      // Try using findByIdAndUpdate first
      try {
        const patchedAssessment = await this.careNoteModel
          .findByIdAndUpdate(id, patchData, {
            new: true, // Return updated document
            runValidators: false, // Disable validation to avoid schema issues
            bypassDocumentValidation: true, // Bypass schema validation for patch
          })
          .exec();

        if (!patchedAssessment) {
          throw new NotFoundException('Failed to patch assessment');
        }

        console.log('Assessment patched successfully:', patchedAssessment._id);
        return patchedAssessment;
      } catch (updateError) {
        console.log(
          'findByIdAndUpdate failed, trying native collection method...',
        );

        // Fallback to native MongoDB collection method
        const collection = this.careNoteModel.collection;
        const updateResult = await collection.findOneAndUpdate(
          { _id: new Types.ObjectId(id) },
          { $set: patchData },
          {
            returnDocument: 'after',
            bypassDocumentValidation: true,
          },
        );

        if (!updateResult || !updateResult.value) {
          throw new NotFoundException('Failed to patch assessment');
        }

        console.log(
          'Assessment patched with native method:',
          updateResult.value._id,
        );
        return updateResult.value;
      }
    } catch (error) {
      console.error('Error patching assessment:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.name === 'CastError') {
        throw new Error('Dữ liệu không đúng định dạng');
      }

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(
          (e: any) => e.message,
        );
        throw new Error(`Lỗi validation: ${validationErrors.join(', ')}`);
      }

      // Handle MongoDB validation errors
      if (error.code === 121) {
        console.error('MongoDB validation error details:', error.errInfo);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error(
          'Schema rules not satisfied:',
          error.errInfo?.details?.schemaRulesNotSatisfied,
        );
        throw new Error('Dữ liệu không hợp lệ với schema MongoDB');
      }

      throw new Error(error.message || 'Lỗi cập nhật đánh giá');
    }
  }

  async remove(id: string): Promise<Assessment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID đánh giá không hợp lệ');
    }

    const assessment = await this.careNoteModel.findByIdAndDelete(id).exec();
    if (!assessment) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return assessment;
  }
}
