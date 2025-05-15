import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastLoginToUser1743334021912 implements MigrationInterface {
    name = 'AddLastLoginToUser1743334021912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`lastLogin\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`lastLogin\``);
    }
} 