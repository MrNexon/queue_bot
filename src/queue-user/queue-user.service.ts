import { Injectable } from '@nestjs/common';
import { Prisma, QueueUser } from '@prisma/client';
import { PrismaService } from '../prisma.serivce';

@Injectable()
export class QueueUserService {
  constructor(private prisma: PrismaService) {}

  async queueUsers(
    queueUserWhereInput: Prisma.QueueUserWhereInput,
  ): Promise<QueueUser[] | null> {
    return this.prisma.queueUser.findMany({
      where: queueUserWhereInput,
    });
  }

  async createQueueUser(data: Prisma.QueueUserCreateInput): Promise<QueueUser> {
    return this.prisma.queueUser.create({
      data,
    });
  }

  async deleteQueueUser(
    where: Prisma.QueueUserWhereUniqueInput,
  ): Promise<QueueUser> {
    return this.prisma.queueUser.delete({
      where,
    });
  }
}
