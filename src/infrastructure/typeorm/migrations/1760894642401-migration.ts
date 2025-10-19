import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760894642401 implements MigrationInterface {
    name = 'Migration1760894642401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."saving_executions_status_enum" AS ENUM('pending', 'success', 'failed', 'skipped')`);
        await queryRunner.query(`CREATE TABLE "saving_executions" ("id" character varying NOT NULL, "savingId" character varying NOT NULL, "scheduledDate" TIMESTAMP NOT NULL, "executedAt" TIMESTAMP, "status" "public"."saving_executions_status_enum" NOT NULL DEFAULT 'pending', "amount" numeric(18,8) NOT NULL, "transactionHash" character varying, "errorMessage" text, "retryCount" integer NOT NULL DEFAULT '0', "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb5a6c255a30645474bfbdab701" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bd7c5d2b2259902086ff73e2d5" ON "saving_executions" ("savingId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c8224e114a54ea31a72178102f" ON "saving_executions" ("scheduledDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_0352e7449abda0e7b1f888f212" ON "saving_executions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_9195265d735f0f093dadf61631" ON "saving_executions" ("status", "scheduledDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_382402dc881837b5c79813d11f" ON "saving_executions" ("savingId", "scheduledDate") `);
        await queryRunner.query(`CREATE TYPE "public"."time_based_savings_frequency_enum" AS ENUM('daily', 'weekly', 'monthly', 'yearly')`);
        await queryRunner.query(`CREATE TABLE "time_based_savings" ("id" character varying NOT NULL, "frequency" "public"."time_based_savings_frequency_enum" NOT NULL, "dayOfMonth" integer NOT NULL, "amountToSave" numeric(18,8) NOT NULL, "tokenToSave" character varying NOT NULL, "userId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "progress" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_f2da7b3365cff3734c3f332b197" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_de30dfc1734dc17d923e17235d" ON "time_based_savings" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "idx_user_active" ON "time_based_savings" ("userId", "isActive") `);
        await queryRunner.query(`ALTER TABLE "saving_executions" ADD CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59" FOREIGN KEY ("savingId") REFERENCES "time_based_savings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" ADD CONSTRAINT "FK_32e498b3a2eb6649359ad1fff57" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_based_savings" DROP CONSTRAINT "FK_32e498b3a2eb6649359ad1fff57"`);
        await queryRunner.query(`ALTER TABLE "saving_executions" DROP CONSTRAINT "FK_bd7c5d2b2259902086ff73e2d59"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_active"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de30dfc1734dc17d923e17235d"`);
        await queryRunner.query(`DROP TABLE "time_based_savings"`);
        await queryRunner.query(`DROP TYPE "public"."time_based_savings_frequency_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_382402dc881837b5c79813d11f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9195265d735f0f093dadf61631"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0352e7449abda0e7b1f888f212"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c8224e114a54ea31a72178102f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd7c5d2b2259902086ff73e2d5"`);
        await queryRunner.query(`DROP TABLE "saving_executions"`);
        await queryRunner.query(`DROP TYPE "public"."saving_executions_status_enum"`);
    }

}
