import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1759945354745 implements MigrationInterface {
    name = 'Migration1759945354745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otps" RENAME COLUMN "identifier" TO "data"`);
        await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "data"`);
        await queryRunner.query(`ALTER TABLE "otps" ADD "data" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "data"`);
        await queryRunner.query(`ALTER TABLE "otps" ADD "data" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "otps" RENAME COLUMN "data" TO "identifier"`);
    }

}
