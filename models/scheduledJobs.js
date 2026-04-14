const whatsappService = require("../services/whatsappService");
const {messageTexts} = require("../config/messageTexts");
const {scheduleJob} = require("node-schedule");
const {getBookingsToday, getBookingsFuture, getBookingsAdmin} = require("./bookingModel");
const {getAllCS, getAllIncomplete} = require("./conversationModel");
const {scheduledAdmins} = require("../config/constants");
const {sendSummary} = require("../services/nodemailer");

/**
 * Runs a scheduled job.
 * Currently not used, instant mails are sent instead after creating a booking, updating, canceling, asking for CS, stopping a conversation, ...
 */
async function scheduledJob() {
    scheduleJob({hour: 4, minute: 30}, async () => {

        // const pendingBookings = await getBookingsAdmin();
        // const nrOfPendingBookings = pendingBookings.length;
        // const bookingsToday = await getBookingsToday();
        // const nrOfBookingsToday = bookingsToday.length;
        // const bookingsFuture = await getBookingsFuture();
        // const nrOfBookingsFuture = bookingsFuture.length;
        // const csConversations = await getAllCS();
        // const nrOfCsConversations = csConversations.length;
        // const incompleteConversations = await getAllIncomplete();
        // const nrOfIncompleteConversations = await incompleteConversations.length;
        console.log('Job runs every day at this time');
//         const scheduledMessage = `Nr of pending bookings: ${nrOfPendingBookings}
// Nr of confirmed bookings for today or tomorrow: ${nrOfBookingsToday}
// Nr of confirmed bookings for the future: ${nrOfBookingsFuture}
// Nr of CS conversations: ${nrOfCsConversations}
// Nr of incomplete conversations: ${nrOfIncompleteConversations}`;
//         scheduledAdmins.forEach((admin) => {
//             whatsappService.sendMessage(admin, scheduledMessage);
//         });
        sendSummary();
    })
}

module.exports = {
    scheduledJob
};