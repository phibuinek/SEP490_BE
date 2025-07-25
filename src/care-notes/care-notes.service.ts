import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assessment, AssessmentDocument } from './schemas/care-note.schema';
import { CreateAssessmentDto } from './dto/create-care-note.dto';
import { UpdateCareNoteDto } from './dto/update-care-note.dto';

@Injectable()
export class CareNotesService {
  constructor(
    @InjectModel(Assessment.name)
    private careNoteModel: Model<AssessmentDocument>,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    const assessment = new this.careNoteModel({
      assessment_type: createAssessmentDto.assessment_type ?? null,
      date: new Date(Date.now() + 7 * 60 * 60 * 1000),
      notes: createAssessmentDto.notes,
      recommendations: createAssessmentDto.recommendations ?? null,
      resident_id: new Types.ObjectId(createAssessmentDto.resident_id),
      conducted_by: createAssessmentDto.conducted_by
        ? new Types.ObjectId(createAssessmentDto.conducted_by)
        : undefined,
    });
    return assessment.save();
  }

  async findAll(resident_id: string) {
    return this.careNoteModel
      .find({ resident_id: new Types.ObjectId(resident_id) })
      .sort({ date: -1 })
      .populate({
        path: 'conducted_by',
        select: 'full_name position',
      })
      .exec();
  }

  async update(id: string, updateAssessmentDto: UpdateCareNoteDto) {
    const assessment = await this.careNoteModel.findById(id).exec();
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }
    if (updateAssessmentDto.assessment_type !== undefined)
      assessment.assessment_type = updateAssessmentDto.assessment_type;
    if (updateAssessmentDto.notes !== undefined)
      assessment.notes = updateAssessmentDto.notes;
    if (updateAssessmentDto.recommendations !== undefined)
      assessment.recommendations = updateAssessmentDto.recommendations;
    if (updateAssessmentDto.resident_id !== undefined)
      assessment.resident_id = new Types.ObjectId(
        updateAssessmentDto.resident_id,
      );
    if (updateAssessmentDto.conducted_by !== undefined)
      assessment.conducted_by = new Types.ObjectId(
        updateAssessmentDto.conducted_by,
      );
    return assessment.save();
  }

  async remove(id: string) {
    const assessment = await this.careNoteModel.findById(id).exec();
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }
    await this.careNoteModel.findByIdAndDelete(id).exec();
    return { message: 'Assessment deleted successfully' };
  }
}
