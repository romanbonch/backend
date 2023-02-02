import {
  Body,
  Controller,
  ForbiddenException,
  Inject,
  Post,
  HttpCode,
} from '@nestjs/common';
import { LoggerProvider } from '../providers/logger.provider';
import { ErrorOutputDto } from '../dtos/error.output.dto';
import { ResponseFilter, ResponseStatus } from "../../../filters/response.filter";

@Controller('logger')
export class LoggerController {
  constructor(@Inject(LoggerProvider) private loggerProvider: LoggerProvider) {}

  @Post()
  @HttpCode(ResponseStatus.SUCCESS)
  public async getAll(@Body("passphrase") passphrase: string): Promise<ResponseFilter<ErrorOutputDto[]>> | never{
    if (passphrase == "password")
      return ResponseFilter.response<ErrorOutputDto[] | {}[]>(
        (await this.loggerProvider.getAll()).map(el => {
          try {
            return {
              id: el.id,
              name: el.name,
              message: el.message,
              stack: JSON.parse(el.stack),
              // image: el.image,
              timestamp: el.createdAt
            };
          } catch (err) {
            return {};
          }
        }),
        ResponseStatus.SUCCESS
      )
    else
      throw new ForbiddenException(
        new Error('Failed passphrase'),
        'Passphrase check failed',
      );
  }
}
