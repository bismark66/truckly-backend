export class DriverRegisterResponse {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: string;
  avatar: string | null;
  googleId: string | null;
  fcmToken: string | null;
  id: string;
  licenseNumber: string;
  vehicleType: string;
}

export class CustomerRegisterResponse {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: string;
  avatar: string | null;
  googleId: string | null;
  fcmToken: string | null;
  id: string;
}

export class FleetRegisterResponse {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: string;
  avatar: string | null;
  googleId: string | null;
  id: string;
}
