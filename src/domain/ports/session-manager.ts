export interface IPersistenceSessionManager {
  executeInTransaction<T>(work: (manager: any) => Promise<T>): Promise<T>;
}
