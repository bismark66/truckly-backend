import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseFloatPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const parsed = parseFloat(value as unknown as string);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(
        `Validation failed (numeric string is expected): ${value}`,
      );
    }
    return parsed;
  }
}
