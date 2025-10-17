import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760716770279 implements MigrationInterface {
    name = 'Migration1760716770279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "qrDataUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "qrDataUrl"`);
    }

}
