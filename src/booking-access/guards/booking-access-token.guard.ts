import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingAccessService } from '@/booking-access/booking-access.service';

export const BOOKING_TOKEN_HEADER = 'x-booking-token';

@Injectable()
export class BookingAccessTokenGuard implements CanActivate {
  constructor(private readonly bookingAccessService: BookingAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers[BOOKING_TOKEN_HEADER];

    const email =
      typeof token === 'string' && token
        ? await this.bookingAccessService.findEmailByToken(token)
        : null;

    if (!email) {
      throw new UnauthorizedException(
        'Link do rezerwacji jest nieprawidłowy lub wygasł',
      );
    }

    request.bookingEmail = email;
    return true;
  }
}
