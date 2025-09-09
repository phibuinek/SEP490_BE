import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { MailService } from '../common/mail.service';

interface UserCreateData extends Omit<CreateUserDto, 'join_date'> {
  join_date?: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      console.log(
        '[USER][CREATE] Input DTO:',
        JSON.stringify(createUserDto, null, 2),
      );
      console.log('[USER][CREATE] Role from DTO:', createUserDto.role);
      console.log('[USER][CREATE] Role type:', typeof createUserDto.role);

      // Check if username already exists
      const existingUsername = await this.findByUsername(
        createUserDto.username,
      );
      if (existingUsername) {
        console.log(
          '[USER][CREATE] Username already exists:',
          createUserDto.username,
        );
        throw new BadRequestException(
          'Tên đăng nhập đã được sử dụng. Vui lòng chọn tên đăng nhập khác.',
        );
      }

      // Check if email already exists
      const existingEmail = await this.findByEmail(createUserDto.email);
      if (existingEmail) {
        console.log(
          '[USER][CREATE] Email already exists:',
          createUserDto.email,
        );
        throw new BadRequestException(
          'Email đã được sử dụng. Vui lòng sử dụng email khác.',
        );
      }

      // Check if phone already exists (NEW VALIDATION)
      if (createUserDto.phone) {
        const existingPhone = await this.findByPhone(createUserDto.phone);
        if (existingPhone) {
          console.log(
            '[USER][CREATE] Phone already exists:',
            createUserDto.phone,
          );
          throw new BadRequestException(
            'Số điện thoại đã được sử dụng. Vui lòng sử dụng số điện thoại khác.',
          );
        }
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      console.log('[USER][CREATE] Password hashed successfully');

      // Set default values for optional fields
      const userData = {
        ...createUserDto,
        password: hashedPassword,
        status: createUserDto.status || UserStatus.ACTIVE, // Admin tạo: ACTIVE mặc định
        role: createUserDto.role, // Ensure role is properly set
      };

      // Convert join_date string to Date object if provided
      let finalUserData: UserCreateData;
      if (userData.join_date && typeof userData.join_date === 'string') {
        try {
          const joinDate = new Date(userData.join_date);
          console.log('[USER][CREATE] Converted join_date to Date:', joinDate);
          // Create new object with converted date, excluding original join_date
          const { join_date, ...userDataWithoutJoinDate } = userData;
          finalUserData = {
            ...userDataWithoutJoinDate,
            join_date: joinDate,
          };
        } catch (error) {
          console.error('[USER][CREATE] Error converting join_date:', error);
          throw new BadRequestException(
            'Định dạng ngày vào làm không hợp lệ. Vui lòng kiểm tra lại.',
          );
        }
      } else {
        // No join_date or already Date
        const { join_date, ...userDataWithoutJoinDate } = userData;
        finalUserData = {
          ...userDataWithoutJoinDate,
          join_date: userData.join_date as Date | undefined,
        };
      }

      console.log(
        '[USER][CREATE] User data to save:',
        JSON.stringify(finalUserData, null, 2),
      );

      const createdUser = new this.userModel(finalUserData);

      console.log('[USER][CREATE] User model created, saving...');
      const savedUser = await createdUser.save();

      console.log('[USER][CREATE] Successfully created user:', savedUser._id);

      // Gửi email thông tin tài khoản nếu có email và có mật khẩu gốc trong DTO
      // Lưu ý: savedUser.password là hash; phải dùng mật khẩu plain từ DTO
      if (
        createUserDto?.email &&
        createUserDto?.password &&
        (savedUser as any).status === UserStatus.ACTIVE
      ) {
        this.mailService
          .sendAccountCredentials({
            to: createUserDto.email,
            username: createUserDto.username,
            password: createUserDto.password,
            role: createUserDto.role,
          })
          .catch(() => {});
      }

      return savedUser;
    } catch (error) {
      console.error('[USER][CREATE][ERROR]', error);
      // Log chi tiết validation từ MongoDB (errInfo.details)
      try {
        const details = (error as any)?.errInfo?.details;
        if (details) {
          console.error('[USER][CREATE][ERROR] MongoDB errInfo.details:', JSON.stringify(details, null, 2));
        }
      } catch {}
      console.error('[USER][CREATE][ERROR] Stack:', error.stack);
      throw error;
    }
  }

  async findAll(department?: string, role?: string): Promise<User[]> {
    const filter: any = {};
    if (department) {
      filter.department = department;
    }
    if (role) {
      filter.role = role; // Sử dụng 'role' thay vì 'roles'
    }
    return this.userModel.find(filter).select('-password').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid user id');
    const user = await this.userModel
      .findById(new Types.ObjectId(id))
      .select('-password')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOneWithPassword(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid user id');
    const user = await this.userModel.findById(new Types.ObjectId(id)).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByDepartment(department: string): Promise<User[]> {
    return this.userModel
      .find({
        department,
        role: 'staff', // Sử dụng 'role' thay vì 'roles'
      })
      .select('-password')
      .exec();
  }

  async findByRoles(roles: string[]): Promise<User[]> {
    return this.userModel
      .find({
        role: { $in: roles }, // Sử dụng $in để tìm users có role trong danh sách
      })
      .select('-password')
      .exec();
  }

  async getUserStatsByRole() {
    const stats = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
            },
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          role: '$_id',
          total: '$count',
          active: '$active',
          inactive: '$inactive',
          _id: 0,
        },
      },
      {
        $sort: { role: 1 },
      },
    ]);

    return {
      total_users: await this.userModel.countDocuments(),
      by_role: stats,
    };
  }

  // XÓA TOÀN BỘ HÀM updateRoles

  async deactivateUser(user_id: string): Promise<User> {
    if (!Types.ObjectId.isValid(user_id))
      throw new BadRequestException('Invalid user id');
    const user = await this.userModel
      .findByIdAndUpdate(
        new Types.ObjectId(user_id),
        { status: 'inactive', updated_at: new Date() },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async activateUser(user_id: string): Promise<User> {
    if (!Types.ObjectId.isValid(user_id))
      throw new BadRequestException('Invalid user id');
    const user = await this.userModel
      .findByIdAndUpdate(
        new Types.ObjectId(user_id),
        { status: 'active', updated_at: new Date() },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async approveUser(user_id: string): Promise<User> {
    if (!Types.ObjectId.isValid(user_id))
      throw new BadRequestException('Invalid user id');

    const userBefore = await this.userModel
      .findById(new Types.ObjectId(user_id))
      .exec();
    if (!userBefore) throw new NotFoundException('User not found');

    const user = await this.userModel
      .findByIdAndUpdate(
        new Types.ObjectId(user_id),
        { status: UserStatus.ACTIVE, updated_at: new Date() },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // gửi email thông báo kích hoạt nếu có email
    if (userBefore.email) {
      this.mailService
        .sendAccountActivatedEmail({
          to: userBefore.email,
          username: userBefore.username,
        })
        .catch(() => {});
    }

    return user;
  }

  async addResidentToFamily(
    family_id: string,
    resident_id: any,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        family_id,
        { $push: { residents: resident_id } },
        { new: true },
      )
      .exec();
  }

  async removeResidentFromFamily(
    family_id: string,
    resident_id: any,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        family_id,
        { $pull: { residents: resident_id } },
        { new: true },
      )
      .exec();
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('ID người dùng không hợp lệ');
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không chính xác');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Đổi mật khẩu thành công' };
  }

  async resetPassword(userId: string, newPassword: string) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('ID người dùng không hợp lệ');
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async updateUserById(
    id: string,
    updateUserDto: Partial<User>,
  ): Promise<User> {
    try {
      if (!Types.ObjectId.isValid(id))
        throw new BadRequestException('ID người dùng không hợp lệ');

      // Log dữ liệu đầu vào để debug
      console.log('updateUserById - Input:', { id, updateUserDto });

      // Validate email format nếu có
      if (updateUserDto.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateUserDto.email)) {
          throw new BadRequestException(
            'Định dạng email không hợp lệ. Vui lòng kiểm tra lại.',
          );
        }

        // Check if email is already in use by another user
        const existingUserWithEmail = await this.findByEmail(
          updateUserDto.email,
        );
        if (
          existingUserWithEmail &&
          (existingUserWithEmail as any)._id.toString() !== id
        ) {
          throw new BadRequestException(
            'Email đã được sử dụng bởi người dùng khác. Vui lòng sử dụng email khác.',
          );
        }
      }

      // Nếu có trường role, ép kiểu về UserRole
      if (updateUserDto.role && typeof updateUserDto.role === 'string') {
        updateUserDto.role = updateUserDto.role as any; // ép kiểu để tránh lỗi linter
      }

      // Xử lý join_date nếu có
      if (
        updateUserDto.join_date &&
        typeof updateUserDto.join_date === 'string'
      ) {
        try {
          const joinDate = new Date(updateUserDto.join_date);
          if (isNaN(joinDate.getTime())) {
            throw new BadRequestException(
              'Định dạng ngày vào làm không hợp lệ. Vui lòng kiểm tra lại.',
            );
          }
          updateUserDto.join_date = joinDate;
          console.log(
            'updateUserById - Converted join_date to Date:',
            joinDate,
          );
        } catch (error) {
          console.error('updateUserById - Error converting join_date:', error);
          throw new BadRequestException(
            'Định dạng ngày vào làm không hợp lệ. Vui lòng kiểm tra lại.',
          );
        }
      }

      const user = await this.userModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateUserDto, { new: true })
        .select('-password')
        .exec();

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng với ID này');
      }

      console.log('updateUserById - Success:', {
        userId: user._id,
        updatedFields: Object.keys(updateUserDto),
      });
      return user;
    } catch (error) {
      console.error('updateUserById - Error:', error);
      throw error;
    }
  }

  async getPasswordById(id: string): Promise<string | undefined> {
    if (!Types.ObjectId.isValid(id)) return undefined;
    const user = await this.userModel.findById(new Types.ObjectId(id)).exec();
    return user?.password;
  }

  async deleteUser(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID người dùng không hợp lệ');

    const user = await this.userModel
      .findByIdAndDelete(new Types.ObjectId(id))
      .exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng để xóa');
    }

    return user;
  }

  async uploadCccd(
    userId: string,
    cccdId: string,
    cccdFront?: Express.Multer.File,
    cccdBack?: Express.Multer.File,
  ): Promise<User> {
    try {
      // Find user
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is family member
      if (user.role !== 'family') {
        throw new BadRequestException('Only family members can upload CCCD');
      }

      // Prepare update data
      const updateData: any = {
        cccd_id: cccdId,
        updated_at: new Date(),
      };

      // Handle file uploads
      if (cccdFront) {
        updateData.cccd_front = cccdFront.path || `uploads/${cccdFront.filename}`;
      }

      if (cccdBack) {
        updateData.cccd_back = cccdBack.path || `uploads/${cccdBack.filename}`;
      }

      // Update user
      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, updateData, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException('Failed to update user CCCD information');
      }

      console.log('[USER][UPLOAD_CCCD] Successfully updated CCCD for user:', userId);
      return updatedUser;
    } catch (error) {
      console.error('[USER][UPLOAD_CCCD] Error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to upload CCCD: ${error.message}`);
    }
  }
}
