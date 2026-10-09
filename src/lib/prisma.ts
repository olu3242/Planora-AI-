import "server-only";
import { PrismaClient } from "@prisma/client";
<<<<<<< HEAD
import type { Prisma } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Bootstrap/maintenance connection: authentication and explicitly authorized
// operational administration use this connection, never tenant request work.
export const authenticationPrisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = authenticationPrisma;
const tenantTransaction = new AsyncLocalStorage<Prisma.TransactionClient>();
export function inTenantTransaction<T>(tx: Prisma.TransactionClient, work: () => Promise<T>) {
  return tenantTransaction.run(tx, work);
}
export const prisma = new Proxy(authenticationPrisma, {
  get(base, property) {
    const tx = tenantTransaction.getStore();
    if (!tx) return Reflect.get(base, property, base);
    if (property === "$transaction") return async <T>(work: (db: Prisma.TransactionClient) => Promise<T>) => {
      if (typeof work !== "function") throw new Error("TENANT_TRANSACTION_CALLBACK_REQUIRED");
      const savepoint = `nested_${randomUUID().replaceAll("-", "")}`;
      await tx.$executeRawUnsafe(`SAVEPOINT ${savepoint}`);
      try {
        const result = await work(tx);
        await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${savepoint}`);
        return result;
      } catch (error) {
        await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${savepoint}`);
        throw error;
      }
    };
    return Reflect.get(tx, property, tx);
  },
});
=======

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
>>>>>>> origin/main
