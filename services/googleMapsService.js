const axios = require('axios');
const config = require('../config/vars');

/**
 * Sends an address to the Google Maps API.
 * @param {string} address - The address to be verified.
 */
async function verifyAddress(address) {
    try {
        const response = await axios.post(config.GOOGLE_MAPS_API_URL_VALIDATE, {
            "address": {
                "addressLines": [address]
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

//        console.log('Address verified successfully:', response.data);
        const formattedAddress = response.data.result.address.formattedAddress
        const verdict = response.data.result.verdict.addressComplete
        return {formattedAddress, verdict};
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}


/**
 * Sends an address to the Google Maps API to calculate the distance.
 * @param {string} address - The address to be checked.
 */
async function getDistanceToAirport(address) {
    try {
        const response = await axios.post(config.GOOGLE_MAPS_API_URL_ROUTE,
            {
                "origin": {
                    "address": address
                },
                "destination": {
                    "address": "luchthaven Zaventem"
                }, // "intermediates": [
                //   {
                //     object (Waypoint)
                //   }
                // ],
                "travelMode": "drive",
                "routingPreference": "TRAFFIC_UNAWARE",
                // "polylineQuality": enum (PolylineQuality),
                // "polylineEncoding": enum (PolylineEncoding),
                // "departureTime": string,
                // "arrivalTime": string,
                "computeAlternativeRoutes": false, // "routeModifiers": {
                //   object (RouteModifiers)
                // },
                // "languageCode": string,
                // "regionCode": string,
                "units": "METRIC"
                // "optimizeWaypointOrder": boolean,
                // "requestedReferenceRoutes": [
                //   enum (ReferenceRoute)
                // ],
                // "extraComputations": [
                //   enum (ExtraComputation)
                // ],
                // "trafficModel": enum (TrafficModel),
                // "transitPreferences": {
                //   object (TransitPreferences)
                // }
            }, {
                headers: {
                    'Content-Type': 'application/json', 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
                }
            });
        const distance = response.data.routes[0].distanceMeters
        const duration = response.data.routes[0].duration.replace('s', '')
        return {distance, duration};
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

/**
 * Sends an address to the Google Maps API to calculate the distance.
 * @param {string} address - The address to be checked.
 */
async function getDistanceFromAirport(address) {
    try {
        const response = await axios.post(config.GOOGLE_MAPS_API_URL_ROUTE,

            {
                "origin": {
                    "address": "luchthaven Zaventem"
                },
                "destination": {
                    "address": address
                }, // "intermediates": [
                //   {
                //     object (Waypoint)
                //   }
                // ],
                "travelMode": "drive",
                "routingPreference": "TRAFFIC_UNAWARE", // "polylineQuality": enum (PolylineQuality),
                // "polylineEncoding": enum (PolylineEncoding),
                // "departureTime": string,
                // "arrivalTime": string,
                "computeAlternativeRoutes": false, // "routeModifiers": {
                //   object (RouteModifiers)
                // },
                // "languageCode": string,
                // "regionCode": string,
                "units": "METRIC"
                // "optimizeWaypointOrder": boolean,
                // "requestedReferenceRoutes": [
                //   enum (ReferenceRoute)
                // ],
                // "extraComputations": [
                //   enum (ExtraComputation)
                // ],
                // "trafficModel": enum (TrafficModel),
                // "transitPreferences": {
                //   object (TransitPreferences)
                // }
            }, {
                headers: {
                    'Content-Type': 'application/json', 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
                }
            });
        const distance = response.data.routes[0].distanceMeters
        const duration = response.data.routes[0].duration.replace('s', '')
        return {distance, duration};
//        return JSON.stringify(response.data.result.address.formattedAddress);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

module.exports = {
    verifyAddress,
    getDistanceToAirport,
    getDistanceFromAirport
};