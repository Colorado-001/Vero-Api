import { DataSource, EntityManager } from "typeorm";
import { IPersistenceSessionManager } from "../../domain/ports";

export class TypeORMSessionManager implements IPersistenceSessionManager {
  constructor(private readonly dataSource: DataSource) {}

  async executeInTransaction<T>(
    work: (manager: EntityManager) => Promise<T>
  ): Promise<T> {
    console.log("Begin db session");
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
      console.log("Db session released");
    }
  }
}
