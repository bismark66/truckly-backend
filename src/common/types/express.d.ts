declare global {
  namespace Express {
    interface Request {
      deviceInfo?: {
        ipAddress: string;
        userAgent: string;
        deviceType: string;
      };
    }
  }
}

export {};
