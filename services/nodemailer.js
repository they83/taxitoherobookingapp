const { google } = require("googleapis");
const {createTransport} = require("nodemailer");
const {getBookingsAdmin, getBookingsToday, getBookingsFuture} = require("../models/bookingModel");
const {getAllCS, getAllIncomplete} = require("../models/conversationModel");
const OAuth2 = google.auth.OAuth2;

// doesn't work anymore (token issue), using app password instead
// const createTransporter = async () => {
//     try {
//         const oauth2Client = new OAuth2(
//             process.env.GOOGLE_CLIENT_ID,
//             process.env.GOOGLE_CLIENT_SECRET,
//             "https://developers.google.com/oauthplayground"
//         );
//
//         oauth2Client.setCredentials({
//             refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
//         });
//
//         const accessToken = await new Promise((resolve, reject) => {
//             oauth2Client.getAccessToken((err, token) => {
//                 if (err) {
//                     console.log("*ERR: ", err)
//                     reject();
//                 }
//                 resolve(token);
//             });
//         });
//
//         return createTransport({
//             service: "gmail",
//             auth: {
//                 type: "OAuth2",
//                 user: process.env.GOOGLE_USER_EMAIL,
//                 accessToken,
//                 clientId: process.env.GOOGLE_CLIENT_ID,
//                 clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//                 refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
//             },
//         });
//     } catch (err) {
//         return err
//     }
// };

// const sendTestMail = async () => {
//     try {
//         const mailOptions = {
//             from: process.env.GOOGLE_USER_EMAIL,
//             to: 'they83@yahoo.com',
//             subject: "Test",
//             text: "Hi, this is a test email",
//         }
//         let emailTransporter = await createTransporter();
//         await emailTransporter.sendMail(mailOptions);
//     } catch (err) {
//         console.log("ERROR: ", err)
//     }
// };

const sendSummary = async () => {
    const pendingBookings = await getBookingsAdmin();
    const nrOfPendingBookings = pendingBookings.length;
    pendingBookingsText = "";
    pendingBookings.forEach((booking) => {pendingBookingsText = pendingBookingsText + JSON.stringify(booking) + "\n\n"
    });
    const bookingsToday = await getBookingsToday();
    const nrOfBookingsToday = bookingsToday.length;
    todayBookingsText = "";
    bookingsToday.forEach((booking) => {todayBookingsText = todayBookingsText + JSON.stringify(booking) + "\n\n"
    });
    const bookingsFuture = await getBookingsFuture();
    const nrOfBookingsFuture = bookingsFuture.length;
    futureBookingsText = "";
    bookingsFuture.forEach((booking) => {futureBookingsText = futureBookingsText + JSON.stringify(booking) + "\n\n"
    });
    const csConversations = await getAllCS();
    const nrOfCsConversations = csConversations.length;
    csConversationsText = "";
    csConversations.forEach((conversation) => {csConversationsText = csConversationsText + JSON.stringify(conversation) + "\n\n"
    });
    const incompleteConversations = await getAllIncomplete();
    const nrOfIncompleteConversations = await incompleteConversations.length;
    incompleteConversationsText = "";
    incompleteConversations.forEach((conversation) => {incompleteConversationsText = incompleteConversationsText + JSON.stringify(conversation) + "\n\n"
    });
    const scheduledMessage = `Nr of pending bookings: ${nrOfPendingBookings}
Nr of confirmed bookings for today or tomorrow: ${nrOfBookingsToday}
Nr of confirmed bookings for the future: ${nrOfBookingsFuture}
Nr of CS conversations: ${nrOfCsConversations}
Nr of incomplete conversations: ${nrOfIncompleteConversations}

Pending bookings: 
${pendingBookingsText}

Bookings today: 
${todayBookingsText}

Bookings future: 
${futureBookingsText}

CS conversations: 
${csConversationsText}

Incomplete conversations: 
${incompleteConversationsText}

`;

    // Create a transporter object
    const transporter = createTransport({
        service: "gmail",
        auth: {
            user: process.env.GOOGLE_USER_EMAIL,
            pass: process.env.GOOGLE_NODEMAILER_APP_PASSWORD
        }
    });
    try {
        const mailOptions = {
            from: process.env.GOOGLE_USER_EMAIL,
            to: process.env.GOOGLE_LIST_EMAIL,
            subject: "Test",
            text: scheduledMessage,
        }
        // let emailTransporter = await createTransporter();
        // await emailTransporter.sendMail(mailOptions);
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}


module.exports = {
    // createTransporter,
    // sendTestMail,
    sendSummary
};