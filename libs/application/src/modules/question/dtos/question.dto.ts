import { QuestionAnswerDto } from './question-answer.dto';
import {
  IsNumber,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionDto {
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  answers: QuestionAnswerDto[];

  value: string;

  @IsNumber(
    {},
    {
      message: 'relative_id must be INT',
    },
  )
  relative_id: number;

  @IsNumber(
    {},
    {
      message: 'coins must be INT',
    },
  )
  coins: number;

  @IsString({
    message: 'title must be STRING',
  })
  @MaxLength(255)
  title: string;

  @IsString({
    message: 'picture must be STRING',
  })
  @ValidateIf((object, value) => value !== null)
  picture: string | null;
}
