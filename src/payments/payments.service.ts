import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  async initiatePayment(createPaymentDto: CreatePaymentDto): Promise<any> {
    const reference = uuidv4();
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      reference,
      status: PaymentStatus.PENDING,
    });
    await this.paymentsRepository.save(payment);

    // Mock Paystack response
    return {
      authorization_url: `https://checkout.paystack.com/${reference}`,
      access_code: reference,
      reference,
    };
  }

  async verifyPayment(reference: string) {
    const payment = await this.paymentsRepository.findOneBy({ reference });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }
    
    // Mock verification logic
    payment.status = PaymentStatus.SUCCESS;
    return this.paymentsRepository.save(payment);
  }

  findAll() {
    return this.paymentsRepository.find();
  }

  findOne(id: string) {
    return this.paymentsRepository.findOneBy({ id });
  }

  update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }
}
