import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVenueSeatingLayout1743334021913 implements MigrationInterface {
    name = 'AddVenueSeatingLayout1743334021913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if columns exist before adding them
        const hasCapacity = await queryRunner.hasColumn('venue', 'capacity');
        const hasSeatingLayout = await queryRunner.hasColumn('venue', 'seatingLayout');
        const hasAssignedSeating = await queryRunner.hasColumn('venue', 'hasAssignedSeating');
        
        if (!hasCapacity) {
            await queryRunner.query(`ALTER TABLE \`venue\` ADD \`capacity\` integer NOT NULL DEFAULT 0`);
        }
        
        if (!hasSeatingLayout) {
            await queryRunner.query(`ALTER TABLE \`venue\` ADD \`seatingLayout\` json NULL`);
        }
        
        if (!hasAssignedSeating) {
            await queryRunner.query(`ALTER TABLE \`venue\` ADD \`hasAssignedSeating\` boolean NOT NULL DEFAULT false`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCapacity = await queryRunner.hasColumn('venue', 'capacity');
        const hasSeatingLayout = await queryRunner.hasColumn('venue', 'seatingLayout');
        const hasAssignedSeating = await queryRunner.hasColumn('venue', 'hasAssignedSeating');
        
        if (hasAssignedSeating) {
            await queryRunner.query(`ALTER TABLE \`venue\` DROP COLUMN \`hasAssignedSeating\``);
        }
        
        if (hasSeatingLayout) {
            await queryRunner.query(`ALTER TABLE \`venue\` DROP COLUMN \`seatingLayout\``);
        }
        
        if (hasCapacity) {
            await queryRunner.query(`ALTER TABLE \`venue\` DROP COLUMN \`capacity\``);
        }
    }
} 