const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

async function testDriverSearch() {
  console.log('Testing driver search...\n');

  // Test GEOSEARCH
  const lat = 5.6037;
  const lng = -0.187;
  const radiusKm = 10;

  console.log(
    `Searching for drivers at lat=${lat}, lng=${lng}, radius=${radiusKm}km`,
  );

  const nearbyDrivers = await redis.call(
    'GEOSEARCH',
    'driver-locations',
    'FROMLONLAT',
    lng,
    lat,
    'BYRADIUS',
    radiusKm,
    'km',
    'WITHDIST',
    'ASC',
    'COUNT',
    10,
  );

  console.log('\nGEOSEARCH result:', nearbyDrivers);
  console.log(
    `Found ${nearbyDrivers ? nearbyDrivers.length / 2 : 0} drivers\n`,
  );

  if (nearbyDrivers && nearbyDrivers.length > 0) {
    // Process results (they come in pairs: [driverId, distance, driverId, distance, ...])
    for (let i = 0; i < nearbyDrivers.length; i += 2) {
      const driverId = nearbyDrivers[i];
      const distance = nearbyDrivers[i + 1];
      const status = await redis.hget('driver-status', driverId);

      console.log(`Driver: ${driverId}`);
      console.log(`  Distance: ${distance}km`);
      console.log(`  Status: ${status}`);
      console.log(`  Is Online: ${status === 'ONLINE'}\n`);
    }
  }

  redis.disconnect();
}

testDriverSearch().catch(console.error);
