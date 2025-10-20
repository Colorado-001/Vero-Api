import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760908777659 implements MigrationInterface {
    name = 'Migration1760908777659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_based_savings" ADD "name" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_based_savings" DROP COLUMN "name"`);
    }

}
