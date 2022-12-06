import { Transaction } from "sequelize";

export module TransactionUtil {
  let host: { transaction: Transaction | null } = { transaction: null };

  export function getHost(): { transaction: Transaction } {
    return host;
  }

  export function setHost(t: Transaction) {
    host = { transaction: t };
  }

  export function isSet(): boolean {
    return (host.transaction != null);
  }

  export function commit(): Promise<void> {
    const res = host.transaction.commit();
    host.transaction = null;
    return res;
  }

  export function rollback(): Promise<void> {
    const res = host.transaction.rollback();
    host.transaction = null;
    return res;
  }
}