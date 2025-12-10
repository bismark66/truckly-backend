import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'newPassword456', description: 'New password' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
