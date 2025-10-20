import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760914639331 implements MigrationInterface {
    name = 'Migration1760914639331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saving_executions" DROP CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_382402dc881837b5c79813d11f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd7c5d2b2259902086ff73e2d5"`);
        await queryRunner.query(`ALTER TABLE "saving_executions" DROP COLUMN "savingId"`);
        await queryRunner.query(`ALTER TABLE "saving_executions" ADD "savingId" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" DROP CONSTRAINT "PK_f2da7b3365cff3734c3f332b197"`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" ADD CONSTRAINT "PK_f2da7b3365cff3734c3f332b197" PRIMARY KEY ("id")`);
        await queryRunner.query(`CREATE INDEX "IDX_bd7c5d2b2259902086ff73e2d5" ON "saving_executions" ("savingId") `);
        await queryRunner.query(`CREATE INDEX "IDX_382402dc881837b5c79813d11f" ON "saving_executions" ("savingId", "scheduledDate") `);
        await queryRunner.query(`ALTER TABLE "saving_executions" ADD CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59" FOREIGN KEY ("savingId") REFERENCES "time_based_savings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saving_executions" DROP CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_382402dc881837b5c79813d11f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd7c5d2b2259902086ff73e2d5"`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" DROP CONSTRAINT "PK_f2da7b3365cff3734c3f332b197"`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" ADD CONSTRAINT "PK_f2da7b3365cff3734c3f332b197" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "saving_executions" DROP COLUMN "savingId"`);
        await queryRunner.query(`ALTER TABLE "saving_executions" ADD "savingId" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_bd7c5d2b2259902086ff73e2d5" ON "saving_executions" ("savingId") `);
        await queryRunner.query(`CREATE INDEX "IDX_382402dc881837b5c79813d11f" ON "saving_executions" ("savingId", "scheduledDate") `);
        await queryRunner.query(`ALTER TABLE "saving_executions" ADD CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59" FOREIGN KEY ("savingId") REFERENCES "time_based_savings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
