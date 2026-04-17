const {createTransport} = require("nodemailer");
const {getBookingsAdmin, getBookingsToday, getBookingsFuture} = require("../models/bookingModel");
const {getAllCS, getAllIncomplete} = require("../models/conversationModel");


// only used in scheduledjobs, using prompt via admintext instead
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
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}

async function sendBookingToAdmin(booking){

    console.log("booking voor mail: ",JSON.stringify(booking));
    bookingText = `Booking reference: ${booking.booking_reference}
To/from: ${booking.selected_option}
Language: ${booking.language}
Date: ${booking.date}
Time: ${booking.time}
Phone nr: ${booking.phone_number}
Alternative phone nr: ${booking.alternative_phone_number}
Name: ${booking.customer_name}
Passengers: ${booking.passengers}
Status: ${booking.status}
Extra info: ${booking.extra_info}
Address: ${booking.address}
Price: ${booking.price}
Distance to airport (in meters): ${booking.distance_to_airport}
Distance from airport (in meters): ${booking.distance_from_airport}
Duration to airport (in seconds): ${booking.duration_to_airport}
Duration from airport (in seconds): ${booking.duration_from_airport}
Flight nr: ${booking.flight_nr}
Luggage: ${booking.luggage}

To confirm a booking send (only as an admin):
confirm: "booking reference"
with the correct booking reference and without the quotes to the whatsapp nr.
That way the client can be asked to rebook this trip (same or reversed) next time they contact the bot.`;

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
            subject: "New booking",
            text: bookingText,
        }
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}


async function sendUpdatedBookingToAdmin(booking){

    console.log("booking voor mail: ",JSON.stringify(booking));
    bookingText = `Booking reference: ${booking.booking_reference}
To/from: ${booking.selected_option}
Language: ${booking.language}
Date: ${booking.date}
Time: ${booking.time}
Phone nr: ${booking.phone_number}
Alternative phone nr: ${booking.alternative_phone_number}
Name: ${booking.customer_name}
Passengers: ${booking.passengers}
Status: ${booking.status}
Extra info: ${booking.extra_info}
Address: ${booking.address}
Price: ${booking.price}
Distance to airport (in meters): ${booking.distance_to_airport}
Distance from airport (in meters): ${booking.distance_from_airport}
Duration to airport (in seconds): ${booking.duration_to_airport}
Duration from airport (in seconds): ${booking.duration_from_airport}
Flight nr: ${booking.flight_nr}
Luggage: ${booking.luggage}

To confirm a booking send (only as an admin):
confirm: "booking reference"
with the correct booking reference and without the quotes to the whatsapp nr.
That way the client can be asked to rebook this trip (same or reversed) next time they contact the bot.`;

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
            subject: "Updated booking",
            text: bookingText,
        }
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}

async function sendCanceledBookingToAdmin(booking){

    console.log("booking voor mail: ",JSON.stringify(booking));
    bookingText = `Booking reference: ${booking.booking_reference}
To/from: ${booking.selected_option}
Language: ${booking.language}
Date: ${booking.date}
Time: ${booking.time}
Phone nr: ${booking.phone_number}
Alternative phone nr: ${booking.alternative_phone_number}
Name: ${booking.customer_name}
Passengers: ${booking.passengers}
Status: ${booking.status}
Extra info: ${booking.extra_info}
Address: ${booking.address}
Price: ${booking.price}
Distance to airport (in meters): ${booking.distance_to_airport}
Distance from airport (in meters): ${booking.distance_from_airport}
Duration to airport (in seconds): ${booking.duration_to_airport}
Duration from airport (in seconds): ${booking.duration_from_airport}
Flight nr: ${booking.flight_nr}
Luggage: ${booking.luggage}`;

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
            subject: "Canceled booking",
            text: bookingText,
        }
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}


async function sendCSToAdmin(phoneNr, language){

    cstext = `${phoneNr} just chose the option CS (language = ${language})`;

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
            subject: "New CS request",
            text: cstext,
        }
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}

async function sendStopToAdmin(phoneNr, context){

    console.log("context voor mail: ",JSON.stringify(context));
    cstext = `A booking was stopped after receiving the price. Details:
    Phone nr: ${phoneNr}
    Language: ${context.language}
    Price: ${context.price}
    Address: ${context.address}
    Selected option: ${context.selectedOption}
    Distance to (in meters): ${context.distanceToAirport}
    Distance from (in meters): ${context.distanceFromAirport}
    Duration to (in seconds): ${context.durationToAirport}
    Duration from (in seconds): ${context.durationFromAirport}`;

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
            subject: "Booking process stopped",
            text: cstext,
        }
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}

async function mailToAdmin(bookings, conversations, customers, prices){
    allBookingsText = "";
    bookings.forEach((booking) => {allBookingsText = allBookingsText + JSON.stringify(booking) + "\n\n"
    });
    allConversationsText = "";
    conversations.forEach((conversation) => {allConversationsText = allConversationsText + JSON.stringify(conversation) + "\n\n"
    });
    allCustomersText = "";
    customers.forEach((customer) => {allCustomersText = allCustomersText + JSON.stringify(customer) + "\n\n"
    });
    allPricesText = "";
    prices.forEach((price) => {allPricesText = allPricesText + JSON.stringify(price) + "\n\n"
    });

    const emailMessage = `Bookings: 
${allBookingsText}

Conversations: 
${allConversationsText}

Customers: 
${allCustomersText}

Prices: 
${allPricesText}

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
            subject: "Admin export bookings and conversations",
            text: emailMessage,
        }
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}


async function sendCustomerToAdmin(customer){

    console.log("customer voor mail: ",JSON.stringify(customer));
    customerText = `Phone nr: ${customer.phone_number}
Language: ${customer.language}
Name: ${customer.customer_name}`;

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
            subject: "New customer",
            text: customerText,
        }
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log("ERROR: ", err)
    }
}

module.exports = {
    sendSummary,
    sendBookingToAdmin,
    sendUpdatedBookingToAdmin,
    sendCanceledBookingToAdmin,
    sendCSToAdmin,
    sendStopToAdmin,
    mailToAdmin,
    sendCustomerToAdmin
};