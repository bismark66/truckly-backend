import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDriverVehicleCapabilities1771381800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add vehicle capacity fields
    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'vehicleCapacity',
        type: 'float',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'vehicleVolume',
        type: 'float',
        isNullable: true,
      }),
    );

    // Add vehicle capability flags
    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'hasFlatbed',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'hasDumpCapability',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'passengerSeats',
        type: 'int',
        isNullable: true,
      }),
    );

    // Set default capacities based on vehicle type
    await queryRunner.query(`
      UPDATE driver 
      SET "vehicleCapacity" = CASE 
        WHEN "vehicleType" = 'TRAILER' THEN 20000
        WHEN "vehicleType" = 'TIPPER_TRUCK' THEN 15000
        WHEN "vehicleType" = 'BUS' THEN 2000
        WHEN "vehicleType" = 'MINING_TRANSPORT' THEN 25000
        ELSE 5000
      END
    `);

    await queryRunner.query(`
      UPDATE driver 
      SET "vehicleVolume" = CASE 
        WHEN "vehicleType" = 'TRAILER' THEN 40
        WHEN "vehicleType" = 'TIPPER_TRUCK' THEN 10
        WHEN "vehicleType" = 'BUS' THEN 5
        WHEN "vehicleType" = 'MINING_TRANSPORT' THEN 15
        ELSE 8
      END
    `);

    // Set capability flags based on vehicle type
    await queryRunner.query(`
      UPDATE driver 
      SET "hasDumpCapability" = true
      WHERE "vehicleType" IN ('TIPPER_TRUCK', 'MINING_TRANSPORT')
    `);

    await queryRunner.query(`
      UPDATE driver 
      SET "passengerSeats" = 50
      WHERE "vehicleType" = 'BUS'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('driver', 'vehicleCapacity');
    await queryRunner.dropColumn('driver', 'vehicleVolume');
    await queryRunner.dropColumn('driver', 'hasFlatbed');
    await queryRunner.dropColumn('driver', 'hasDumpCapability');
    await queryRunner.dropColumn('driver', 'passengerSeats');
  }
}
