import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760945775076 implements MigrationInterface {
    name = 'Migration1760945775076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."delegations_type_enum" AS ENUM('allowance', 'group_wallet')`);
        await queryRunner.query(`CREATE TYPE "public"."delegations_frequency_enum" AS ENUM('Daily')`);
        await queryRunner.query(`CREATE TABLE "delegations" ("id" character varying NOT NULL, "type" "public"."delegations_type_enum" NOT NULL, "name" character varying NOT NULL, "userId" uuid NOT NULL, "amountLimit" numeric(18,8) NOT NULL, "walletAddress" character varying, "frequency" "public"."delegations_frequency_enum", "startDate" TIMESTAMP, "members" jsonb, "approvalThreshold" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_01f9fbbc9b3bf52236a4e951b19" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "delegations" ADD CONSTRAINT "FK_4d06aa6f5f9ee94952fd6ebb0ba" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delegations" DROP CONSTRAINT "FK_4d06aa6f5f9ee94952fd6ebb0ba"`);
        await queryRunner.query(`DROP TABLE "delegations"`);
        await queryRunner.query(`DROP TYPE "public"."delegations_frequency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."delegations_type_enum"`);
    }

}
