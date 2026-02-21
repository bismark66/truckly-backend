import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {}

  async create(
    userId: string,
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
  ): Promise<Document> {
    const document = this.documentsRepository.create({
      ...createDocumentDto,
      userId,
      url: file.path,
    });
    return this.documentsRepository.save(document);
  }

  findAll() {
    return this.documentsRepository.find();
  }

  findAllByUserId(userId: string) {
    return this.documentsRepository.find({ where: { userId } });
  }

  findOne(id: string) {
    return this.documentsRepository.findOneBy({ id });
  }

  update(id: number, updateDocumentDto: UpdateDocumentDto) {
    return `This action updates a #${id} document`;
  }

  remove(id: number) {
    return `This action removes a #${id} document`;
  }
}
