import { HttpStatus } from '@nestjs/common';
import { ResponseDto } from '../dto/response.dto';

export class ResponseHelper {
  public static success(
    message: string = 'Operation successful',
    statusCode: number = HttpStatus.OK,
    data?: any,
  ): ResponseDto {
    return {
      statusCode,
      message,
      ...(data && { data }),
    };
  }

  public static created(
    message: string = 'Resource created successfully',
    data?: any,
  ): ResponseDto {
    return this.success(message, HttpStatus.CREATED, data);
  }

  public static updated(
    message: string = 'Resource updated successfully',
    data?: any,
  ): ResponseDto {
    return this.success(message, HttpStatus.ACCEPTED, data);
  }

  public static deleted(
    message: string = 'Resource deleted successfully',
  ): ResponseDto {
    return this.success(message, HttpStatus.OK);
  }

  public static softDeleted(
    message: string = 'Resource soft deleted successfully',
  ): ResponseDto {
    return this.success(message, HttpStatus.ACCEPTED);
  }

  public static restored(
    message: string = 'Resource restored successfully',
  ): ResponseDto {
    return this.success(message, HttpStatus.OK);
  }
}
