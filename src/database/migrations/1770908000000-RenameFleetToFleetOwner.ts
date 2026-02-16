import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameFleetToFleetOwner1770908000000 implements MigrationInterface {
    name = 'RenameFleetToFleetOwner1770908000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename table from fleet to fleet_owner
        await queryRunner.renameTable('fleet', 'fleet_owner');
        
        // Rename foreign key column in vehicle table
        await queryRunner.renameColumn('vehicle', 'fleetId', 'fleetOwnerId');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert column rename
        await queryRunner.renameColumn('vehicle', 'fleetOwnerId', 'fleetId');
        
        // Revert table rename
        await queryRunner.renameTable('fleet_owner', 'fleet');
    }
}
