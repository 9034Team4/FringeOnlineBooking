import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimestampsToPayment1743334021912 implements MigrationInterface {
    name = 'AddTimestampsToPayment1743334021912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if columns exist before adding them
        const hasCreatedAt = await queryRunner.hasColumn('payment', 'createdAt');
        const hasUpdatedAt = await queryRunner.hasColumn('payment', 'updatedAt');
        
        if (!hasCreatedAt && !hasUpdatedAt) {
            await queryRunner.query(`
                ALTER TABLE payment 
                ADD COLUMN createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                ADD COLUMN updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
            `);
        } else if (!hasCreatedAt) {
            await queryRunner.query(`
                ALTER TABLE payment 
                ADD COLUMN createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            `);
        } else if (!hasUpdatedAt) {
            await queryRunner.query(`
                ALTER TABLE payment 
                ADD COLUMN updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCreatedAt = await queryRunner.hasColumn('payment', 'createdAt');
        const hasUpdatedAt = await queryRunner.hasColumn('payment', 'updatedAt');
        
        if (hasCreatedAt && hasUpdatedAt) {
            await queryRunner.query(`
                ALTER TABLE payment 
                DROP COLUMN createdAt,
                DROP COLUMN updatedAt
            `);
        } else if (hasCreatedAt) {
            await queryRunner.query(`
                ALTER TABLE payment 
                DROP COLUMN createdAt
            `);
        } else if (hasUpdatedAt) {
            await queryRunner.query(`
                ALTER TABLE payment 
                DROP COLUMN updatedAt
            `);
        }
    }
} 