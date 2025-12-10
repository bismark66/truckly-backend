import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';
import { Driver, DriverStatus, VehicleType } from '../../drivers/entities/driver.entity';
import { Fleet } from '../../fleets/entities/fleet.entity';
import { Vehicle, VehicleStatus } from '../../vehicles/entities/vehicle.entity';
import { Booking, BookingStatus, BookingType } from '../../bookings/entities/booking.entity';
import { Payment, PaymentStatus } from '../../payments/entities/payment.entity';
import { Document, DocumentType } from '../../documents/entities/document.entity';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

// Ghana coordinates (Accra area)
const GHANA_COORDS = {
  lat: { min: 5.5, max: 5.7 },
  lng: { min: -0.3, max: 0.1 },
};

// Ghanaian cities for addresses
const GHANA_CITIES = ['Accra', 'Kumasi', 'Tema', 'Takoradi', 'Tamale', 'Cape Coast'];

function getGhanaLocation() {
  return {
    lat: faker.number.float({ min: GHANA_COORDS.lat.min, max: GHANA_COORDS.lat.max, fractionDigits: 6 }),
    lng: faker.number.float({ min: GHANA_COORDS.lng.min, max: GHANA_COORDS.lng.max, fractionDigits: 6 }),
    address: `${faker.location.streetAddress()}, ${faker.helpers.arrayElement(GHANA_CITIES)}, Ghana`,
  };
}

function generateLicensePlate(): string {
  const region = faker.helpers.arrayElement(['GR', 'GT', 'GW', 'GN', 'GE', 'GC', 'AS', 'BA']);
  const number = faker.number.int({ min: 1000, max: 9999 });
  const suffix = faker.number.int({ min: 10, max: 99 });
  return `${region}-${number}-${suffix}`;
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
    entities: [User, Driver, Fleet, Vehicle, Booking, Payment, Document],
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
  const fleetRepo = dataSource.getRepository(Fleet);
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
  await dataSource.query('TRUNCATE TABLE "fleet" CASCADE');
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
    const driver = driverRepo.create({
      userId: driverUser.id,
      licenseNumber: `GHA-${faker.string.alphanumeric(8).toUpperCase()}`,
      vehicleType: faker.helpers.arrayElement(Object.values(VehicleType)),
      status: faker.helpers.arrayElement([DriverStatus.ONLINE, DriverStatus.OFFLINE]),
      currentLatitude: location.lat,
      currentLongitude: location.lng,
      isVerified: faker.datatype.boolean({ probability: 0.7 }),
    });
    const savedDriver = await driverRepo.save(driver);
    drivers.push(savedDriver);

    // Add driver location to Redis for geospatial queries
    await redis.call('GEOADD', 'driver-locations', location.lng, location.lat, savedDriver.id);
  }

  console.log(`✅ Created ${drivers.length} drivers (also added to Redis)\n`);

  // ============ SEED FLEETS ============
  console.log('🏢 Seeding fleets...');
  const fleets: Fleet[] = [];

  for (const fleetOwner of fleetOwnerUsers) {
    const fleet = fleetRepo.create({
      userId: fleetOwner.id,
      companyName: `${faker.company.name()} Transport`,
      registrationNumber: `RC-${faker.string.numeric(6)}`,
    });
    fleets.push(await fleetRepo.save(fleet));
  }

  console.log(`✅ Created ${fleets.length} fleets\n`);

  // ============ SEED VEHICLES ============
  console.log('🚚 Seeding vehicles...');
  const vehicles: Vehicle[] = [];

  for (let i = 0; i < 10; i++) {
    const fleet = faker.helpers.arrayElement(fleets);
    const assignedDriver = i < 3 ? drivers[i] : null; // Assign first 3 vehicles to drivers

    const vehicle = vehicleRepo.create({
      fleetId: fleet.id,
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

    const booking = bookingRepo.create({
      customerId: customer.id,
      driverId: status !== BookingStatus.PENDING ? driver.id : undefined,
      vehicleId: status !== BookingStatus.PENDING ? vehicle.id : undefined,
      pickupLocation: getGhanaLocation(),
      dropoffLocation: getGhanaLocation(),
      status,
      type: faker.helpers.arrayElement(Object.values(BookingType)),
      price: parseFloat(faker.commerce.price({ min: 100, max: 5000, dec: 2 })),
      scheduledTime: status === BookingStatus.PENDING ? faker.date.future() : undefined,
    });
    bookings.push(await bookingRepo.save(booking));
  }

  console.log(`✅ Created ${bookings.length} bookings\n`);

  // ============ SEED PAYMENTS ============
  console.log('💳 Seeding payments...');
  const payments: Payment[] = [];

  const completedBookings = bookings.filter((b) => b.status === BookingStatus.COMPLETED);

  for (const booking of completedBookings) {
    const payment = paymentRepo.create({
      bookingId: booking.id,
      amount: booking.price,
      status: faker.helpers.arrayElement([PaymentStatus.SUCCESS, PaymentStatus.PENDING]),
      reference: `PAY-${faker.string.alphanumeric(10).toUpperCase()}`,
      provider: 'PAYSTACK',
    });
    payments.push(await paymentRepo.save(payment));
  }

  // Add some pending payments for other bookings
  const inProgressBookings = bookings.filter((b) => b.status === BookingStatus.IN_PROGRESS);
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
  console.log(`  🏢 Fleets: ${fleets.length}`);
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
