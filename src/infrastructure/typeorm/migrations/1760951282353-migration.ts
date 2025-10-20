import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760951282353 implements MigrationInterface {
    name = 'Migration1760951282353'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delegations" ADD "signedBlockchainDelegation" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delegations" DROP COLUMN "signedBlockchainDelegation"`);
    }

}
