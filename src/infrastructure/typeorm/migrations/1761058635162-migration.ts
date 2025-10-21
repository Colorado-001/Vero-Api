import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761058635162 implements MigrationInterface {
    name = 'Migration1761058635162'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."time_based_savings_frequency_enum" RENAME TO "time_based_savings_frequency_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."time_based_savings_frequency_enum" AS ENUM('daily', 'weekly', 'monthly', 'yearly', 'every_n_minutes')`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" ALTER COLUMN "frequency" TYPE "public"."time_based_savings_frequency_enum" USING "frequency"::"text"::"public"."time_based_savings_frequency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."time_based_savings_frequency_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."time_based_savings_frequency_enum_old" AS ENUM('daily', 'weekly', 'monthly', 'yearly')`);
        await queryRunner.query(`ALTER TABLE "time_based_savings" ALTER COLUMN "frequency" TYPE "public"."time_based_savings_frequency_enum_old" USING "frequency"::"text"::"public"."time_based_savings_frequency_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."time_based_savings_frequency_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."time_based_savings_frequency_enum_old" RENAME TO "time_based_savings_frequency_enum"`);
    }

}
