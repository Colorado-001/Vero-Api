import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760071713764 implements MigrationInterface {
    name = 'Migration1760071713764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pinSetup" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "pin" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pin"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pinSetup"`);
    }

}
