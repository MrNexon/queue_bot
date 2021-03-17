import { Injectable } from '@nestjs/common';
import { Prisma, Queue } from '@prisma/client';
import { PrismaService } from '../prisma.serivce';
import { QueueExtendType } from './queue-extend.type';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async queue(
    queueWhereUniqueInput: Prisma.QueueWhereUniqueInput,
    queueInclude?: Prisma.QueueInclude,
  ): Promise<QueueExtendType | null> {
    return this.prisma.queue.findUnique({
      where: queueWhereUniqueInput,
      include: queueInclude,
    });
  }

  async createQueue(data: Prisma.QueueCreateInput): Promise<Queue> {
    return this.prisma.queue.create({
      data,
    });
  }
}
