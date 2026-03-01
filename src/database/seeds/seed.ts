import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../resources/users/entities/user.entity';
import { Driver, VehicleType } from '../../resources/drivers/entities/driver.entity';
import { DriverStatus } from '../../resources/drivers/driver-status.service';
import { FleetOwner } from '../../resources/fleet-owners/entities/fleet-owner.entity';
import { Vehicle, VehicleStatus } from '../../resources/vehicles/entities/vehicle.entity';
import {
  Booking,
  BookingStatus,
  BookingType,
} from '../../resources/bookings/entities/booking.entity';
import { Payment, PaymentStatus } from '../../resources/payments/entities/payment.entity';
import {
  Document,
  DocumentType,
} from '../../resources/documents/entities/document.entity';
import { CargoType } from '../../resources/transport/factory';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

// Ghana coordinates (Accra area)
const GHANA_COORDS = {
  lat: { min: 5.5, max: 5.7 },
  lng: { min: -0.3, max: 0.1 },
};

// Ghanaian cities for addresses
const GHANA_CITIES = [
  'Accra',
  'Kumasi',
  'Tema',
  'Takoradi',
  'Tamale',
  'Cape Coast',
];

function getGhanaLocation() {
  return {
    lat: faker.number.float({
      min: GHANA_COORDS.lat.min,
      max: GHANA_COORDS.lat.max,
      fractionDigits: 6,
    }),
    lng: faker.number.float({
      min: GHANA_COORDS.lng.min,
      max: GHANA_COORDS.lng.max,
      fractionDigits: 6,
    }),
    address: `${faker.location.streetAddress()}, ${faker.helpers.arrayElement(GHANA_CITIES)}, Ghana`,
  };
}

function generateLicensePlate(): string {
  const region = faker.helpers.arrayElement([
    'GR',
    'GT',
    'GW',
    'GN',
    'GE',
    'GC',
    'AS',
    'BA',
  ]);
  const number = faker.number.int({ min: 1000, max: 9999 });
  const suffix = faker.number.int({ min: 10, max: 99 });
  return `${region}-${number}-${suffix}`;
}

/**
 * Generate realistic cargo requirements based on vehicle type
 */
function generateCargoRequirements(vehicleType?: VehicleType) {
  // 30% chance to not include cargo requirements (backward compatibility)
  if (faker.datatype.boolean({ probability: 0.3 })) {
    return undefined;
  }

  // If vehicle type is provided, generate matching cargo requirements
  if (vehicleType) {
    switch (vehicleType) {
      case VehicleType.TIPPER_TRUCK:
        return {
          weight: faker.number.int({ min: 3000, max: 15000 }),
          volume: faker.number.float({ min: 10, max: 30, fractionDigits: 2 }),
          cargoType: faker.helpers.arrayElement([
            CargoType.BULK,
            CargoType.MINING,
          ]),
          requiresDump: true,
          specialRequirements: faker.helpers.arrayElement([
            'Sand delivery for construction',
            'Gravel for road work',
            'Mining materials',
            'Soil for landscaping',
          ]),
        };

      case VehicleType.BUS:
        return {
          weight: faker.number.int({ min: 1000, max: 4000 }), // Estimated passenger weight
          cargoType: CargoType.PASSENGERS,
          requiresPassengerSeats: true,
          specialRequirements: faker.helpers.arrayElement([
            'Staff transport',
            'School trip',
            'Wedding guests',
            'Corporate event transport',
          ]),
        };

      case VehicleType.TRAILER:
        return {
          weight: faker.number.int({ min: 5000, max: 25000 }),
          volume: faker.number.float({ min: 20, max: 60, fractionDigits: 2 }),
          cargoType: faker.helpers.arrayElement([
            CargoType.PACKAGED,
            CargoType.GENERAL,
          ]),
          specialRequirements: faker.helpers.arrayElement([
            'Electronics shipment',
            'Furniture delivery',
            'General cargo',
            'Packaged goods',
          ]),
        };

      case VehicleType.MINING_TRANSPORT:
        return {
          weight: faker.number.int({ min: 10000, max: 40000 }),
          volume: faker.number.float({ min: 15, max: 50, fractionDigits: 2 }),
          cargoType: CargoType.MINING,
          requiresDump: faker.datatype.boolean(),
          specialRequirements: faker.helpers.arrayElement([
            'Heavy mining equipment',
            'Ore transport',
            'Mining machinery',
            'Excavated materials',
          ]),
        };

      default: // OTHER or unknown
        return {
          weight: faker.number.int({ min: 2000, max: 10000 }),
          volume: faker.number.float({ min: 5, max: 25, fractionDigits: 2 }),
          cargoType: CargoType.GENERAL,
          specialRequirements: 'General freight',
        };
    }
  }

  // Random cargo requirements if no vehicle type specified
  const cargoType = faker.helpers.arrayElement(Object.values(CargoType));
  const baseRequirement: any = {
    weight: faker.number.int({ min: 1000, max: 20000 }),
    volume: faker.number.float({ min: 5, max: 40, fractionDigits: 2 }),
    cargoType,
  };

  // Add specific requirements based on cargo type
  switch (cargoType) {
    case CargoType.BULK:
      baseRequirement.requiresDump = true;
      baseRequirement.specialRequirements = 'Loose bulk materials';
      break;
    case CargoType.PASSENGERS:
      baseRequirement.requiresPassengerSeats = true;
      baseRequirement.specialRequirements = 'Passenger transport';
      break;
    case CargoType.PACKAGED:
      baseRequirement.specialRequirements = 'Packaged goods';
      break;
    case CargoType.MINING:
      baseRequirement.requiresDump = faker.datatype.boolean();
      baseRequirement.specialRequirements = 'Mining-related cargo';
      break;
    default:
      baseRequirement.specialRequirements = 'General freight';
  }

  return baseRequirement;
}

/**
 * Get vehicle capacity specifications based on vehicle type
 */
function getVehicleCapacityByType(vehicleType: VehicleType) {
  switch (vehicleType) {
    case VehicleType.TRAILER:
      return {
        vehicleCapacity: faker.number.int({ min: 18000, max: 22000 }), // 18-22 tons
        vehicleVolume: faker.number.float({
          min: 35,
          max: 45,
          fractionDigits: 2,
        }), // 35-45 m³
        hasFlatbed: faker.datatype.boolean({ probability: 0.3 }), // 30% have flatbed
        hasDumpCapability: false,
        passengerSeats: undefined,
      };
    case VehicleType.TIPPER_TRUCK:
      return {
        vehicleCapacity: faker.number.int({ min: 13000, max: 17000 }), // 13-17 tons
        vehicleVolume: faker.number.float({
          min: 8,
          max: 12,
          fractionDigits: 2,
        }), // 8-12 m³
        hasFlatbed: false,
        hasDumpCapability: true,
        passengerSeats: undefined,
      };
    case VehicleType.BUS:
      return {
        vehicleCapacity: faker.number.int({ min: 1500, max: 2500 }), // 1.5-2.5 tons (passenger weight)
        vehicleVolume: faker.number.float({
          min: 4,
          max: 6,
          fractionDigits: 2,
        }), // 4-6 m³
        hasFlatbed: false,
        hasDumpCapability: false,
        passengerSeats: faker.number.int({ min: 30, max: 60 }), // 30-60 seats
      };
    case VehicleType.MINING_TRANSPORT:
      return {
        vehicleCapacity: faker.number.int({ min: 22000, max: 28000 }), // 22-28 tons
        vehicleVolume: faker.number.float({
          min: 12,
          max: 18,
          fractionDigits: 2,
        }), // 12-18 m³
        hasFlatbed: faker.datatype.boolean({ probability: 0.4 }), // 40% have flatbed
        hasDumpCapability: true,
        passengerSeats: undefined,
      };
    case VehicleType.OTHER:
    default:
      return {
        vehicleCapacity: faker.number.int({ min: 4000, max: 6000 }), // 4-6 tons
        vehicleVolume: faker.number.float({
          min: 6,
          max: 10,
          fractionDigits: 2,
        }), // 6-10 m³
        hasFlatbed: faker.datatype.boolean({ probability: 0.2 }), // 20% have flatbed
        hasDumpCapability: false,
        passengerSeats: undefined,
      };
  }
}

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'truckly',
    entities: [User, Driver, FleetOwner, Vehicle, Booking, Payment, Document],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('✅ Database connected\n');

  // Connect to Redis
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });
  console.log('✅ Redis connected\n');

  // Get repositories
  const userRepo = dataSource.getRepository(User);
  const driverRepo = dataSource.getRepository(Driver);
  const fleetOwnerRepo = dataSource.getRepository(FleetOwner);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const bookingRepo = dataSource.getRepository(Booking);
  const paymentRepo = dataSource.getRepository(Payment);
  const documentRepo = dataSource.getRepository(Document);

  // Clear existing data using raw queries (TypeORM 0.3+ doesn't allow empty criteria for delete)
  console.log('🧹 Clearing existing data...');
  await dataSource.query('TRUNCATE TABLE "payment" CASCADE');
  await dataSource.query('TRUNCATE TABLE "booking" CASCADE');
  await dataSource.query('TRUNCATE TABLE "document" CASCADE');
  await dataSource.query('TRUNCATE TABLE "vehicle" CASCADE');
  await dataSource.query('TRUNCATE TABLE "fleet_owner" CASCADE');
  await dataSource.query('TRUNCATE TABLE "driver" CASCADE');
  await dataSource.query('TRUNCATE TABLE "user" CASCADE');
  // Clear Redis driver locations
  await redis.del('driver-locations');
  console.log('✅ Existing data cleared (DB + Redis)\n');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ============ SEED USERS ============
  console.log('👤 Seeding users...');
  const users: User[] = [];

  // 2 Admins
  for (let i = 0; i < 2; i++) {
    const user = userRepo.create({
      email: faker.internet.email({ firstName: `admin${i + 1}` }),
      password: hashedPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: `+233${faker.string.numeric(9)}`,
      role: UserRole.ADMIN,
    });
    users.push(await userRepo.save(user));
  }

  // 10 Customers
  for (let i = 0; i < 10; i++) {
    const user = userRepo.create({
      email: faker.internet.email({ firstName: `customer${i + 1}` }),
      password: hashedPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: `+233${faker.string.numeric(9)}`,
      role: UserRole.CUSTOMER,
    });
    users.push(await userRepo.save(user));
  }

  // 5 Drivers
  const driverUsers: User[] = [];
  for (let i = 0; i < 5; i++) {
    const user = userRepo.create({
      email: faker.internet.email({ firstName: `driver${i + 1}` }),
      password: hashedPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: `+233${faker.string.numeric(9)}`,
      role: UserRole.DRIVER,
    });
    driverUsers.push(await userRepo.save(user));
    users.push(driverUsers[i]);
  }

  // 3 Fleet Owners
  const fleetOwnerUsers: User[] = [];
  for (let i = 0; i < 3; i++) {
    const user = userRepo.create({
      email: faker.internet.email({ firstName: `fleetowner${i + 1}` }),
      password: hashedPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: `+233${faker.string.numeric(9)}`,
      role: UserRole.FLEET_OWNER,
    });
    fleetOwnerUsers.push(await userRepo.save(user));
    users.push(fleetOwnerUsers[i]);
  }

  console.log(`✅ Created ${users.length} users\n`);

  // ============ SEED DRIVERS ============
  console.log('🚗 Seeding drivers...');
  const drivers: Driver[] = [];

  for (const driverUser of driverUsers) {
    const location = getGhanaLocation();
    const vehicleType = faker.helpers.arrayElement(Object.values(VehicleType));
    const vehicleCapacitySpecs = getVehicleCapacityByType(vehicleType);

    const driver = driverRepo.create({
      userId: driverUser.id,
      licenseNumber: `GHA-${faker.string.alphanumeric(8).toUpperCase()}`,
      vehicleType,
      ...vehicleCapacitySpecs, // Spread vehicle capacity specs
      currentLatitude: location.lat,
      currentLongitude: location.lng,
      lastSeenAt: new Date(),
      isVerified: faker.datatype.boolean({ probability: 0.7 }),
    });
    const savedDriver = await driverRepo.save(driver);
    drivers.push(savedDriver);

    // Add driver location to Redis for geospatial queries
    await redis.call(
      'GEOADD',
      'driver-locations',
      location.lng,
      location.lat,
      savedDriver.id,
    );

    // Set initial status in Redis (randomize ONLINE/OFFLINE)
    const status = faker.helpers.arrayElement([
      DriverStatus.ONLINE,
      DriverStatus.OFFLINE,
    ]);
    await redis.hset('driver-status', savedDriver.id, status);

    console.log(
      `  ✓ Driver ${savedDriver.id}: ${vehicleType} (${vehicleCapacitySpecs.vehicleCapacity}kg, ${vehicleCapacitySpecs.vehicleVolume}m³)`,
    );
  }

  console.log(`✅ Created ${drivers.length} drivers (also added to Redis)\n`);

  // ============ SEED FLEET OWNERS ============
  console.log('🏢 Seeding fleet owners...');
  const fleetOwners: FleetOwner[] = [];

  for (const fleetOwnerUser of fleetOwnerUsers) {
    const fleetOwner = fleetOwnerRepo.create({
      userId: fleetOwnerUser.id,
      companyName: `${faker.company.name()} Transport`,
      registrationNumber: `RC-${faker.string.numeric(6)}`,
    });
    fleetOwners.push(await fleetOwnerRepo.save(fleetOwner));
  }

  console.log(`✅ Created ${fleetOwners.length} fleet owners\n`);

  // ============ SEED VEHICLES ============
  console.log('🚚 Seeding vehicles...');
  const vehicles: Vehicle[] = [];

  for (let i = 0; i < 10; i++) {
    const fleetOwner = faker.helpers.arrayElement(fleetOwners);
    const assignedDriver = i < 3 ? drivers[i] : null; // Assign first 3 vehicles to drivers

    const vehicle = vehicleRepo.create({
      fleetOwnerId: fleetOwner.id,
      licensePlate: generateLicensePlate(),
      type: faker.helpers.arrayElement(Object.values(VehicleType)),
      capacity: faker.number.float({ min: 5, max: 50, fractionDigits: 1 }),
      status: faker.helpers.arrayElement(Object.values(VehicleStatus)),
      assignedDriverId: assignedDriver?.id,
    });
    vehicles.push(await vehicleRepo.save(vehicle));
  }

  console.log(`✅ Created ${vehicles.length} vehicles\n`);

  // ============ SEED BOOKINGS ============
  console.log('📦 Seeding bookings...');
  const bookings: Booking[] = [];

  const customers = users.filter((u) => u.role === UserRole.CUSTOMER);

  for (let i = 0; i < 15; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const driver = faker.helpers.arrayElement(drivers);
    const vehicle = faker.helpers.arrayElement(vehicles);
    const status = faker.helpers.arrayElement(Object.values(BookingStatus));

    // Generate cargo requirements based on vehicle type if booking is assigned
    const cargoRequirements =
      status !== BookingStatus.PENDING
        ? generateCargoRequirements(vehicle.type)
        : generateCargoRequirements(); // Random cargo for pending bookings

    const booking = bookingRepo.create({
      customerId: customer.id,
      driverId: status !== BookingStatus.PENDING ? driver.id : undefined,
      vehicleId: status !== BookingStatus.PENDING ? vehicle.id : undefined,
      pickupLocation: getGhanaLocation(),
      dropoffLocation: getGhanaLocation(),
      status,
      type: faker.helpers.arrayElement(Object.values(BookingType)),
      price: parseFloat(faker.commerce.price({ min: 100, max: 5000, dec: 2 })),
      scheduledTime:
        status === BookingStatus.PENDING ? faker.date.future() : undefined,
      cargoRequirements, // Add cargo requirements
    });
    bookings.push(await bookingRepo.save(booking));
  }

  console.log(
    `✅ Created ${bookings.length} bookings (with cargo requirements)\n`,
  );

  // ============ SEED PAYMENTS ============
  console.log('💳 Seeding payments...');
  const payments: Payment[] = [];

  const completedBookings = bookings.filter(
    (b) => b.status === BookingStatus.COMPLETED,
  );

  for (const booking of completedBookings) {
    const payment = paymentRepo.create({
      bookingId: booking.id,
      amount: booking.price,
      status: faker.helpers.arrayElement([
        PaymentStatus.SUCCESS,
        PaymentStatus.PENDING,
      ]),
      reference: `PAY-${faker.string.alphanumeric(10).toUpperCase()}`,
      provider: 'PAYSTACK',
    });
    payments.push(await paymentRepo.save(payment));
  }

  // Add some pending payments for other bookings
  const inProgressBookings = bookings.filter(
    (b) => b.status === BookingStatus.IN_PROGRESS,
  );
  for (const booking of inProgressBookings.slice(0, 3)) {
    const payment = paymentRepo.create({
      bookingId: booking.id,
      amount: booking.price,
      status: PaymentStatus.PENDING,
      reference: `PAY-${faker.string.alphanumeric(10).toUpperCase()}`,
      provider: 'PAYSTACK',
    });
    payments.push(await paymentRepo.save(payment));
  }

  console.log(`✅ Created ${payments.length} payments\n`);

  // ============ SEED DOCUMENTS ============
  console.log('📄 Seeding documents...');
  const documents: Document[] = [];

  // Documents for drivers
  for (const driverUser of driverUsers) {
    const docTypes = [DocumentType.LICENSE, DocumentType.ID_CARD];
    for (const docType of docTypes) {
      const doc = documentRepo.create({
        userId: driverUser.id,
        type: docType,
        url: `https://storage.truckly.com/documents/${driverUser.id}/${docType.toLowerCase()}.pdf`,
        isVerified: faker.datatype.boolean({ probability: 0.6 }),
      });
      documents.push(await documentRepo.save(doc));
    }
  }

  // Documents for fleet owners
  for (const fleetOwner of fleetOwnerUsers) {
    const doc = documentRepo.create({
      userId: fleetOwner.id,
      type: DocumentType.INSURANCE,
      url: `https://storage.truckly.com/documents/${fleetOwner.id}/insurance.pdf`,
      isVerified: faker.datatype.boolean({ probability: 0.8 }),
    });
    documents.push(await documentRepo.save(doc));
  }

  console.log(`✅ Created ${documents.length} documents\n`);

  // ============ SUMMARY ============
  console.log('🎉 Seeding complete!\n');
  console.log('Summary:');
  console.log(`  👤 Users: ${users.length}`);
  console.log(`  🚗 Drivers: ${drivers.length}`);
  console.log(`  🏢 Fleet Owners: ${fleetOwners.length}`);
  console.log(`  🚚 Vehicles: ${vehicles.length}`);
  console.log(`  📦 Bookings: ${bookings.length}`);
  console.log(`  💳 Payments: ${payments.length}`);
  console.log(`  📄 Documents: ${documents.length}`);
  console.log('\n📝 Default password for all users: password123');

  await redis.disconnect();
  await dataSource.destroy();
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
