import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareNote, CareNoteDocument } from './schemas/care-note.schema';
import { CreateCareNoteDto } from './dto/create-care-note.dto';
import { UpdateCareNoteDto } from './dto/update-care-note.dto';

@Injectable()
export class CareNotesService {
  constructor(
    @InjectModel(CareNote.name)
    private careNoteModel: Model<CareNoteDocument>,
  ) {}

  async create(createCareNoteDto: CreateCareNoteDto, staff: { staffId: string, staffName: string, staffRole: string }) {
    const careNote = new this.careNoteModel({
      date: new Date(createCareNoteDto.date),
      content: createCareNoteDto.content,
      residentId: new Types.ObjectId(createCareNoteDto.residentId),
      staffId: new Types.ObjectId(staff.staffId),
      staffName: staff.staffName,
      staffRole: staff.staffRole,
    });
    return careNote.save();
  }

  async findAll(residentId: string) {
    return this.careNoteModel.find({ residentId: new Types.ObjectId(residentId) }).sort({ date: -1 }).exec();
  }

  async update(id: string, updateCareNoteDto: UpdateCareNoteDto) {
    const careNote = await this.careNoteModel.findById(id).exec();
    if (!careNote) {
      throw new NotFoundException('Care note not found');
    }
    if (updateCareNoteDto.date !== undefined) careNote.date = new Date(updateCareNoteDto.date);
    if (updateCareNoteDto.content !== undefined) careNote.content = updateCareNoteDto.content;
    return careNote.save();
  }

  async remove(id: string) {
    const careNote = await this.careNoteModel.findById(id).exec();
    if (!careNote) {
      throw new NotFoundException('Care note not found');
    }
    await this.careNoteModel.findByIdAndDelete(id).exec();
    return { message: 'Care note deleted successfully' };
  }
} 