export type TimeSlot = {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  isBooked: boolean;
  guestName: string | null;
  guestEmail: string | null;
  createdAt: Date;
};

export type BookedTimeSlot = TimeSlot & {
  aiConfirmationMessage: string;
};
