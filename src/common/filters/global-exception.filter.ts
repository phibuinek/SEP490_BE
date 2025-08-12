import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

// Mapping các thông báo lỗi kỹ thuật sang thông báo thân thiện
const ERROR_MESSAGE_MAPPINGS = {
  // User/Account related
  'Username already exists': 'Tên đăng nhập đã được sử dụng. Vui lòng chọn tên đăng nhập khác.',
  'Email already exists': 'Email đã được sử dụng. Vui lòng sử dụng email khác.',
  'Invalid user id': 'ID người dùng không hợp lệ.',
  'User not found': 'Không tìm thấy người dùng.',
  'Invalid email format': 'Định dạng email không hợp lệ. Vui lòng kiểm tra lại.',
  'Invalid join_date format': 'Định dạng ngày vào làm không hợp lệ. Vui lòng kiểm tra lại.',
  'Old password is incorrect': 'Mật khẩu cũ không chính xác.',
  'New passwords do not match': 'Mật khẩu mới và xác nhận mật khẩu không khớp.',
  
  // Resident related
  'Resident not found': 'Không tìm thấy thông tin người cao tuổi.',
  'Invalid resident ID': 'ID người cao tuổi không hợp lệ.',
  'Invalid resident_id format': 'Định dạng ID người cao tuổi không hợp lệ.',
  
  // Staff related
  'Staff not found': 'Không tìm thấy thông tin nhân viên.',
  'User is not a staff member': 'Người dùng này không phải là nhân viên.',
  'Invalid staff_id format': 'Định dạng ID nhân viên không hợp lệ.',
  
  // Activity related
  'Activity not found': 'Không tìm thấy hoạt động.',
  'Invalid activity_id format': 'Định dạng ID hoạt động không hợp lệ.',
  
  // Participation related
  'Invalid participation ID format': 'Định dạng ID tham gia không hợp lệ.',
  'Participation with ID': 'Không tìm thấy thông tin tham gia.',
  'Participation not found for resident': 'Không tìm thấy thông tin tham gia cho người cao tuổi này.',
  'Staff is already actively assigned to this resident': 'Nhân viên đã được phân công cho người cao tuổi này.',
  
  // Vital signs related
  'Vital sign not found': 'Không tìm thấy chỉ số sinh hiệu.',
  'Invalid vital sign ID': 'ID chỉ số sinh hiệu không hợp lệ.',
  
  // Care plans related
  'CarePlan with ID': 'Không tìm thấy kế hoạch chăm sóc.',
  
  // Care notes/Assessments related
  'Assessment not found': 'Không tìm thấy đánh giá.',
  'Failed to update assessment': 'Không thể cập nhật đánh giá.',
  'Failed to patch assessment': 'Không thể chỉnh sửa đánh giá.',
  
  // Bills related
  'Bill #': 'Không tìm thấy hóa đơn.',
  'resident_id is required': 'ID người cao tuổi là bắt buộc.',
  'staff_id is required': 'ID nhân viên là bắt buộc.',
  'Invalid family member ID format': 'Định dạng ID thành viên gia đình không hợp lệ.',
  
  // General validation
  'Invalid input': 'Dữ liệu đầu vào không hợp lệ.',
  'Required field': 'Trường này là bắt buộc.',
  'No valid fields to update': 'Không có dữ liệu nào để cập nhật.',
  'Invalid ID format': 'Định dạng ID không hợp lệ.',
  'Invalid format': 'Định dạng không hợp lệ.',
  
  // MongoDB errors
  'E11000': 'Thông tin đã tồn tại trong hệ thống.',
  'Cast to ObjectId failed': 'ID không hợp lệ.',
  
  // Common patterns
  'not found': 'Không tìm thấy thông tin.',
  'already exists': 'Thông tin đã tồn tại.',
  'is required': 'là bắt buộc.',
  'Invalid': 'Không hợp lệ.',
  'Failed to': 'Không thể.',
} as const;

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
    let error = 'Internal Server Error';

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = this.translateMessage(exceptionResponse);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        if (Array.isArray(responseObj.message)) {
          message = this.translateMessage(responseObj.message[0]);
        } else if (responseObj.message) {
          message = this.translateMessage(responseObj.message);
        }
      }
      
      error = exception.name;
    } else if (exception instanceof MongoError) {
      // Handle MongoDB specific errors
      if (exception.code === 11000) {
        status = HttpStatus.CONFLICT;
        message = 'Thông tin đã tồn tại trong hệ thống.';
        error = 'Duplicate Key Error';
      } else {
        message = 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.';
        error = 'Database Error';
      }
    } else if (exception instanceof Error) {
      message = this.translateMessage(exception.message);
      error = exception.name;
    }

    // Log the error for debugging
    this.logger.error(
      `Exception occurred: ${error} - ${message}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    // Create user-friendly error response
    const errorResponse = {
      statusCode: status,
      message: message,
      error: error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Translate technical error messages to user-friendly Vietnamese messages
   */
  private translateMessage(originalMessage: string): string {
    if (!originalMessage) return 'Có lỗi xảy ra. Vui lòng thử lại sau.';

    let translatedMessage = originalMessage;

    // Check for exact matches first
    for (const [key, value] of Object.entries(ERROR_MESSAGE_MAPPINGS)) {
      if (translatedMessage.includes(key)) {
        translatedMessage = translatedMessage.replace(key, value);
      }
    }

    // Handle common patterns
    translatedMessage = translatedMessage
      .replace(/Please enter a valid value/g, 'Vui lòng nhập giá trị hợp lệ')
      .replace(/The two nearest valid values are/g, 'Hai giá trị hợp lệ gần nhất là')
      .replace(/Invalid input/g, 'Dữ liệu đầu vào không hợp lệ')
      .replace(/Required field/g, 'Trường này là bắt buộc')
      .replace(/must be a number/g, 'phải là số')
      .replace(/must be greater than/g, 'phải lớn hơn')
      .replace(/must be less than/g, 'phải nhỏ hơn')
      .replace(/must be between/g, 'phải nằm trong khoảng')
      .replace(/must be an integer/g, 'phải là số nguyên')
      .replace(/decimal places/g, 'chữ số thập phân')
      .replace(/maximum/g, 'tối đa')
      .replace(/minimum/g, 'tối thiểu')
      .replace(/value/g, 'giá trị')
      .replace(/values/g, 'giá trị')
      .replace(/with ID "/g, 'với ID "')
      .replace(/" not found/g, '" không tìm thấy')
      .replace(/format/g, 'định dạng')
      .replace(/is required/g, 'là bắt buộc')
      .replace(/already exists/g, 'đã tồn tại')
      .replace(/not found/g, 'không tìm thấy')
      .replace(/Invalid/g, 'Không hợp lệ')
      .replace(/Failed to/g, 'Không thể');

    return translatedMessage;
  }
}
