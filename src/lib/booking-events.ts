// Any button can open the booking dialog without importing it.
export const OPEN_BOOKING = "booking:open";

export const openBooking = () => window.dispatchEvent(new Event(OPEN_BOOKING));
