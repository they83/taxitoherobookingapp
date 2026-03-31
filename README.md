# About
A WhatsApp business tool for taxi bookings to and from the Zaventem airport. This project combines messaging automation
and booking management.

# WhatsApp Taxi Booking System - User Experience Flow

## Complete Customer Journey

### 1. **Initial Contact** 
**Customer:** Messages Taxi WhatsApp Business number  
**Bot Response:**
```
Welcome to Taxi Tohero Booking Bot!
I can help you book a taxi from or to the Zaventem airport.

Please select your preferred language:

1. English
2. French
3. Dutch
```

### 2. **Option Selection**
**Customer:** Chooses language  
**Bot Response:**
```
Please choose between booking a taxi from or to the Zaventem airport:

You can always send 0 to go back to the last step.

1. Arrival
2. Departure
3. Customer service
```

### 3. **Enter address** 
**Customer:** Chooses option 1 or 2 (3 ends the process)
**Bot Response:**
```
Thank you for booking a taxi from Zaventem airport. Please send a destination address. 

You can always send 0 to go back to the last step.
```

### 4. **Address verification and Booking Details**
**Customer:** Entered an address  
**Bot Response:**
```
You entered this address: 
street 1 city
It was verified as: "Street 1, 9999 City, Country"

```

```
Please provide the following information:

Date: 2026/08/15
Time: 1430
Number of passengers: 2
Name: John Doe
Additional info: flightnr SN3245, wheelchair, large luggage, ...

All on a separate line as in this example. Copy the next message to make this easiest. 

You can always send 0 to go back to the last step.
```

```
Date: 
Time: 
Number of passengers: 
Name: 
Additional info:
```

### 5. **Booking Details Processing**
**Customer:** Sends booking details
**Bot Response:**
```
Booking Summary:

Booking reference: ${conversation.booking_reference}
From Zaventem airport to ${conversation.context.address}
Date: ${conversation.context.date}
Time: ${conversation.context.time}
Passengers: ${conversation.context.passengers}
Name: ${conversation.context.name}
Additional info: ${conversation.context.info}
                    
When your booking is reviewed you will be contacted. You can still send additional info, or use 0 to go back to the 
last step, or CANCEL to start over.

```

### 6. **Pending status**
**Customer:** Sends additional messages
**Bot Response:**
```
This extra info was added. Your booking still needs to be verified. Any extra info you send will be added in the 
request.
```

# WhatsApp Taxi Booking System - Admin Flow

## Overview of all admin options

### 1. **Give all options**
**Admin:** Messages Taxi WhatsApp Business number with the prompt 'admin'
**Bot Response:**
```
`Hello admin. You can check bookings (pending/confirmed), requests to talk to customer service or incomplete 
conversations. 
Select an option.
You can also go straight to these options with the text allbookings, allcs or incomplete.

1. Bookings
2. Context CS
3. Incomplete status
`
```

### 2. **Pending bookings**
**Admin:** Messages Taxi WhatsApp Business number with the prompt 'allbookings' (or pressing the button '1. Bookings')
**Bot Response:** For each pending booking a message is sent, so the admin can review and confirm or take manual action. 
```
`Select pending bookings (need to be confirmed) or confirmed bookings for today/tomorrow or the future.
You can also go straight to these options with the text pendingbookings, bookingstoday or bookingsfuture.

1. Bookings pending
2. Confirmed today
3. Confirmed future
`
```

### 3. **CS conversations**
**Admin:** Messages Taxi WhatsApp Business number with the prompt 'allcs'
**Bot Response:** For each conversation where the client wanted to speak to customer service, a message is sent
```
`Phone: ${conversation.phone_number}
Language: ${conversation.context.language}
ID: ${conversation.id}

OR

No results found.

+

To complete a conversation send:
*complete: "id"*
with the correct id and without the quotes.`
```

### 4. **Incomplete conversations**
**Admin:** Messages Taxi WhatsApp Business number with the prompt 'incomplete'
**Bot Response:** For each conversation that is not completed or pending (booking reference is created), 
a message is sent.
```
`Phone: ${conversation.phone_number}
Language: ${conversation.context.language}
Booking reference: ${conversation.booking_reference}
Name: ${conversation.context.name}
Date: ${conversation.context.date}
Time: ${conversation.context.time}
Passengers: ${conversation.context.passengers}
Extra info: ${conversation.context.info}
Option: ${conversation.context.selectedOption}
Address: ${conversation.context.address}
Distance to airport: ${conversation.context.distanceToAirport} (in meters)
Duration to airport: ${conversation.context.durationToAirport} (in meters)
Distance from airport: ${conversation.context.distanceFromAirport} (in seconds)
Duration from airport: ${conversation.context.durationFromAirport} (in seconds)
ID: ${conversation.id}`;

OR

No results found.

+

To complete a conversation send:
*complete: "id"*
with the correct id and without the quotes.`
```

### 5. **Booking summaries**
**Bot Response:** When bookings are requested, the bot sends a summary for each found bookings
```
Booking reference: ${conversation.booking_reference}
Phone: ${conversation.phone_number}
Name: ${conversation.context.name}
Date: ${conversation.context.date}
Time: ${conversation.context.time}
Passengers: ${conversation.context.passengers}
Extra info: ${conversation.context.info}
Option: ${conversation.context.selectedOption}
Address: ${conversation.context.address}
Language: ${conversation.context.language}
Distance to airport: ${conversation.context.distanceToAirport} (in meters)
Duration to airport: ${conversation.context.durationToAirport} (in meters)
Distance from airport: ${conversation.context.distanceFromAirport} (in seconds)
Duration from airport: ${conversation.context.durationFromAirport} (in seconds)

To confirm a booking send:
confirm: "booking reference"
with the correct booking reference and without the quotes.
```


### 5. **Confirming a booking**
**Admin action:** Sends a message in the format `Confirm: <booking reference>`
**Bot Response:** When a booking is confirmed, the bot sends an update to the admin and the client
```
To admin:
This booking has been confirmed. The client has been notified.

To client:
Your booking ${bookingRef} has been confirmed. Thank you for your reservation.
```


### 6. **Daily overview**
**Bot Response:** Every day the bot sends a summary to the admins (separate list from the admins with access to the admin tools)
with the amount of bookings (pending, confirmed for today/tomorrow, confirmed for future), open cs conversations 
and incomplete conversations
```
`Nr of pending bookings: ${nrOfPendingBookings}
Nr of confirmed bookings for today or tomorrow: ${nrOfBookingsToday}
Nr of confirmed bookings for the future: ${nrOfBookingsFuture}
Nr of CS conversations: ${nrOfCsConversations}
Nr of incomplete conversations: ${nrOfIncompleteConversations}`
```