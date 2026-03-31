// Global Constants
// This file defines fixed values used throughout the application,
// such as conversation states for the bot.

const STATES = {
    START: 'start',
    CS: 'cs',
    SELECTING_LANGUAGE: 'selecting_language',
    SELECTING_ARRIVAL_OR_DEPARTURE: 'selecting_arrival_or_departure',
    INCOMING_REBOOKING: 'incoming_rebooking',
    SELECTING_REBOOKING: 'selecting_rebooking',
    ENTERING_ADDRESS: 'entering_address',
    CHOOSING_PROCEED: 'choosing_proceed',
    CHOOSING_PROCEED_REBOOKING: 'choosing_proceed_rebooking',
    CHOSE_STOP: 'chose_stop',
    ENTERING_BOOKING_DETAILS: 'entering_booking_details',
    ENTERING_REBOOKING_DETAILS: 'entering_rebooking_details',
    PENDING: 'pending',
    COMPLETED: 'completed'
};

const admins = ['32498179526', '32498179525', '32472430394', '32472430389'];

const scheduledAdmins = ['32498179525'];

module.exports = {
    STATES,
    admins,
    scheduledAdmins
};
