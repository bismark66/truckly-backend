const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("✅ Connected! Socket ID:", socket.id);
  
  // Test trackDriver event
  socket.emit("trackDriver", { driverId: "driver123" });
  
  // Test updateLocation event
  socket.emit("updateLocation", {
    driverId: "driver123",
    lat: 5.6037,
    lng: -0.1870
  });
});

socket.on("tracking", (data) => {
  console.log("📍 Tracking response:", data);
});

socket.on("driverLocation", (data) => {
  console.log("🚚 Driver location update:", data);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 Disconnected:", reason);
});

// Keep the script running for 10 seconds
setTimeout(() => {
  console.log("Test complete, disconnecting...");
  socket.disconnect();
  process.exit(0);
}, 10000);
