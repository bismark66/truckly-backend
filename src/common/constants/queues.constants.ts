export const QUEUES = {
  BOOKING_ALLOCATION: 'booking-allocation',
};

export enum BookingAllocationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}
