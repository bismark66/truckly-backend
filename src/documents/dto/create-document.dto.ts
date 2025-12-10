import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  @ApiProperty({ 
    example: 'LICENSE', 
    enum: DocumentType,
    description: 'Type of document being uploaded'
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;
}
