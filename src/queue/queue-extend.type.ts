import { Queue, QueueUser } from "@prisma/client";

export type QueueExtendType = Queue & {
  QueueUser?: QueueUser[]
}
