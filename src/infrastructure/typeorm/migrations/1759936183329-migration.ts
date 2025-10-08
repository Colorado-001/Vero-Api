import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1759936183329 implements MigrationInterface {
    name = 'Migration1759936183329'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying NOT NULL, "privateKey" text NOT NULL, "smartAccountAddress" character varying(100) NOT NULL, "ownerEOA" character varying(100) NOT NULL, "implementation" character varying(50) NOT NULL, "deployed" boolean NOT NULL DEFAULT false, "enabled" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b53f209e20b27c83b99cba4bb5" ON "users" ("smartAccountAddress", "ownerEOA") `);
        await queryRunner.query(`CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "identifier" character varying NOT NULL, "token" character varying NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9b11a5727bf8dfdd5869f04226" ON "otps" ("token", "type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_9b11a5727bf8dfdd5869f04226"`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b53f209e20b27c83b99cba4bb5"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
