import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760798513683 implements MigrationInterface {
    name = 'Migration1760798513683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hash" text NOT NULL, "userOpHash" text NOT NULL, "from" character varying NOT NULL, "to" character varying NOT NULL, "tokenAddress" character varying, "amount" character varying NOT NULL, "status" "public"."transactions_status_enum" NOT NULL, "sponsored" boolean NOT NULL, "gas" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    }

}
