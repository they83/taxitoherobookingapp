// This file contains all texts sent via the WhatsApp bot

const messageTexts = {

    welcomeMessage:
`Welcome to Taxi Tohero Booking Bot!
I can help you book a taxi from or to the Zaventem airport.

Please select your preferred language:
1. English
2. Français
3. Nederlands

Reply with the number of your choice.`,
    welcomeMessageShort:
        `Welcome to Taxi Tohero Booking Bot!
I can help you book a taxi from or to the Zaventem airport.

Please select your preferred language:`,
    selectionMessageEnglish:
`Please choose between booking a taxi from or to the Zaventem airport:

1. Arrival (from Zaventem airport)
2. Departure (to Zaventem airport)
3. 💬 Speak to customer service

Reply with the number of your preferred option.
You can always send 0 to go back to the last step.`,
    selectionMessageFrench:
`Veuillez choisir entre réserver un taxi depuis ou vers l'aéroport de Zaventem:

1. Arrivée (depuis l'aéroport de Zaventem)
2. Départ (vers l'aéroport de Zaventem)
3. 💬 Contactez le service client

Indiquez-nous le numéro correspondant à votre choix.
Vous pouvez toujours envoyer 0 pour revenir à l'étape précédente.`,
    selectionMessageDutch:
`Gelieve te kiezen tussen een taxi van of naar de luchthaven in Zaventem:

1. Aankomst (van de luchthaven in Zaventem)
2. Vertrek (naar de luchthaven in Zaventem)
3. 💬 Contacteer customer service

Antwoord met het nummer van je keuze.`,
    selectionMessageShortEnglish:
`Please choose between booking a taxi from or to the Zaventem airport:

You can always send 0 to go back to the last step.`,
    selectionMessageShortFrench:
`Veuillez choisir entre réserver un taxi depuis ou vers l'aéroport de Zaventem:

Vous pouvez toujours envoyer 0 pour revenir à l'étape précédente.`,
    selectionMessageShortDutch:
`Gelieve te kiezen tussen een taxi van of naar de luchthaven in Zaventem:

U kan altijd 0 gebruiken om naar de laatste step terug te keren.`,
    incorrectLanguageSelectionMessage:
`Reply with the number of your choice.`,
    arrivalMessageEnglish:
`Thank you for booking a taxi from Zaventem airport. Please send a destination address. 

You can always send 0 to go back to the last step.`,
    departureMessageEnglish:
`Thank you for booking a taxi to Zaventem airport. Please send a starting address.

You can always send 0 to go back to the last step.`,
    csEnglish:
'💬 Connecting you to customer service... Please wait.',
    incorrectSelectionMessageEnglish:
`Invalid step in selection. Please start over.`,
    arrivalMessageFrench:
`Merci de réserver un taxi depuis l'aéroport de Zaventem. Veuillez indiquer l'adresse de destination.

Vous pouvez toujours envoyer 0 pour revenir à l'étape précédente.`,
    departureMessageFrench:
`Merci de réserver un taxi vers l'aéroport de Zaventem. Veuillez indiquer l'adresse de destination.

Vous pouvez toujours envoyer 0 pour revenir à l'étape précédente.`,
    csFrench:
`💬 Vous êtes mis en relation avec le service client... Veuillez patienter..`,
    incorrectSelectionMessageFrench:
`Étape de sélection invalide. Veuillez recommencer..`,
    arrivalMessageDutch:
`Bedankt om een taxi vanuit de luchthaven in Zaventem te boeken. Gelieve het adres mee te delen.

U kan altijd 0 gebruiken om naar de laatste step terug te keren.`,
    departureMessageDutch:
`Bedankt om een taxi tot de luchthaven in Zaventem te boeken. Gelieve het adres mee te delen.

U kan altijd 0 gebruiken om naar de laatste step terug te keren.`,
    csDutch:
`💬 U wordt verbonden met onze customer service... Gelieve geduld te hebben..`,
    incorrectSelectionMessageDutch:
`Foutieve stap in de selectie. Start aub opnieuw.
1. Aankomst (vanaf luchthaven Zaventem)
2. Vertrek (naar luchthaven Zaventem)
3. 💬 Spreek met customer service`,
    bookingDetailsEnglish:
`Please provide the following information:

*Date*, *Time* ; *Number of passengers* ; *Name* ; *Additional info*

2026/08/15 ; 1430 ; 2 ; John Doe ; flightnr SN3245, wheelchair, large luggage, ...

All on a single line separated by ; in the *exact* format as the example. 

You can always send 0 to go back to the last step.`,
    bookingDetailsFrench:
`Veuillez nous fournir les informations suivantes:

*Date* ; *Heure* ; *Nombre de passagers* ; *Nom* ; *Informations complémentaires*

2026/08/15 ; 1430 ; 2 ; John Doe ; numéro du vol SN3245, fauteuil roulant, bagages volumineux, ...

Tout sur une ligne, séparée par ; dans le format *exact* indiqué ci-dessus dans cet exemple.

Vous pouvez toujours envoyer 0 pour revenir à l'étape précédente.`,
    bookingDetailsDutch:
`Gelieve de volgende info te sturen:

*Datum* ; *Tijdstip* ; *Aantal passagiers* ; *Naam* ; *Extra info*

2026/08/15 ; 1430 ; 2 ; John Doe ; vluchtnummer SN3245, rolstoel, grote baggage, ...

Alles op één regel gescheiden door ; in the *exacte* format zoals in dit voorbeeld. 

U kan altijd 0 gebruiken om naar de laatste step terug te keren.`,
    rebookingDetailsEnglish:
        `Please provide the following information:

*Date*, *Time* ; *Number of passengers* ; *Additional info*

2026/08/15 ; 1430 ; 2 ; flightnr SN3245, wheelchair, large luggage, ...

All on a single line separated by ; in the *exact* format as the example. 

You can always send 0 to go back to the last step.`,
    rebookingDetailsFrench:
        `Veuillez nous fournir les informations suivantes:

*Date* ; *Heure* ; *Nombre de passagers* ; *Informations complémentaires*

2026/08/15 ; 1430 ; 2 ; numéro du vol SN3245, fauteuil roulant, bagages volumineux, ...

Tout sur une ligne, séparée par ; dans le format *exact* indiqué ci-dessus dans cet exemple.

Vous pouvez toujours envoyer 0 pour revenir à l'étape précédente.`,
    rebookingDetailsDutch:
        `Gelieve de volgende info te sturen:

*Datum* ; *Tijdstip* ; *Aantal passagiers* ; *Extra info*

2026/08/15 ; 1430 ; 2 ; vluchtnummer SN3245, rolstoel, grote baggage, ...

Alles op één regel gescheiden door ; in the *exacte* format zoals in dit voorbeeld. 

U kan altijd 0 gebruiken om naar de laatste step terug te keren.`,
    couldNotParseBookingDetailsEnglish:
`I could not understand the booking details. 
Please provide them in the *exact format* shown above.
The booking needs to be made at least 24h in advance. 
The max number of passengers is 8.`,
    couldNotParseBookingDetailsFrench:
`Je n'ai pas compris les détails de la réservation. 
Veuillez me les fournir dans le format *exact* indiqué ci-dessus.
La réservation doit être effectuée au moins 24h à l'avance.
Le nombre maximum de passagers est 8.`,
    couldNotParseBookingDetailsDutch:
`Ik kon de details niet verwerken. 
Gelieve ze nogmaals in het *exacte formaat* zoals hierboven getoond in te voeren.
De boeking moet ten minste 24u op voorhand gemaakt worden. 
Het maximum aantal passagiers is 8.`,
    pendingMessageEnglish:
`This extra info was added. Your booking still needs to be verified. Any extra info you send will be added in the request.`,
    pendingMessageFrench:
`Cette information supplémentaire a été ajoutée. Votre réservation doit encore être vérifiée. Toute information supplémentaire que vous enverrez sera ajoutée à la demande.`,
    pendingMessageDutch:
`Deze extra info werd toegevoegd. Uw reservatie moet nog bevestigd worden. Alle extra info die u stuurt wordt aan de aanvraag toegevoegd.`,
    unprocessedMessageEnglish:
`Sorry, only text and our interactive (button) messages can be processed. Please try again.`,
    unprocessedMessageFrench:
`Désolé, seuls les messages texte et nos messages interactifs (bouton) peuvent être traités. Veuillez réessayer.`,
    unprocessedMessageDutch:
`Sorry, enkel tekst en onze interactive (button) messages kunnen verwerkt worden. Probeer aub opnieuw.`,
    stopMessageEnglish:
`If you want to start again, send any message.`,
    stopMessageFrench:
`Si vous souhaitez recommencer, envoyez n'importe quel message.`,
    stopMessageDutch:
`Indien u opnieuw wil beginnen, stuur dan een nieuw bericht.`,
    errorMessageEnglish:
`Sorry, something went wrong on our end. Please try again later.`,
    errorMessageFrench:
`Désolé, une erreur s'est produite de notre côté. Veuillez réessayer plus tard.`,
    errorMessageDutch:
`Sorry, er ging iets mis. Probeer aub later opnieuw.`,
    addressErrorMessageEnglish:
`Sorry, the address could not be verified. It needs to be findable via Google Maps. Please try again.`,
    addressErrorMessageFrench:
`Désolé, l'adresse n'a pas pu être vérifiée. Elle doit être trouvable via Google Maps. Veuillez réessayer.`,
    addressErrorMessageDutch:
`Sorry, het adres kon niet worden geverifieerd. Het moet vindbaar zijn via Google Maps. Probeer aub opnieuw.`,
    adminOverviewMessage:
`Hello admin. You can check bookings (pending/confirmed), requests to talk to customer service (includes stopped conversations) or incomplete conversations. 
Select an option.
You can also go straight to these options with the text allbookings, allcs or incomplete.`,
    adminBookingsOverviewMessage:
`Select pending bookings (need to be confirmed) or confirmed bookings for today/tomorrow or the future.
You can also go straight to these options with the text pendingbookings, bookingstoday or bookingsfuture.`,
    adminConfirmInstructionsMessage:
`To confirm a booking send:
*confirm: "booking reference"*
with the correct booking reference and without the quotes.`,
    adminBookingConfirmedMessage:
`This booking has been confirmed. The client has been notified.`,
    adminNoBookingFoundMessage:
`This booking is not found. Please check the reference.`,
    adminCompleteMessage:
`To complete a conversation send:
*complete: "id"*
with the correct id and without the quotes.`,
    adminNoCsConversationFoundMessage:
`This conversation is not found. Please check the ID.`,
    adminCsUpdatedMessage:
`The CS conversation has been updated successfully.`,
    adminNoResultsMessage:
`No results found.`
}


module.exports = {
    messageTexts
};