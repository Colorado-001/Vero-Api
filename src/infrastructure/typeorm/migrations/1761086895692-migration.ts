import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761086895692 implements MigrationInterface {
    name = 'Migration1761086895692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saving_executions" DROP CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59"`);
        await queryRunner.query(`ALTER TABLE "saving_executions" ADD CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59" FOREIGN KEY ("savingId") REFERENCES "time_based_savings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saving_executions" DROP CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59"`);
        await queryRunner.query(`ALTER TABLE "saving_executions" ADD CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59" FOREIGN KEY ("savingId") REFERENCES "time_based_savings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
