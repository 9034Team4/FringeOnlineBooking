import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimestampsToPayment1743334021912 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE payment 
            ADD COLUMN createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            ADD COLUMN updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE payment 
            DROP COLUMN createdAt,
            DROP COLUMN updatedAt
        `);
    }
} 