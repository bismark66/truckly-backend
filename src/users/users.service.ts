import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'role', 'firstName', 'lastName'], // Explicitly select password for auth
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
console.log(id, updateUserDto);
   const response = this.usersRepository.update(id, updateUserDto); 

    return response;
  }

  remove(id: string) {
    return this.usersRepository.delete(id);
    
  }

  /**
   * Find user by ID with password field included (for password change)
   */
  findOneWithPassword(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'password', 'role', 'firstName', 'lastName'],
    });
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, { password: hashedPassword });
  }
}
