const postgresStatement =
    `ALTER TABLE bookings ALTER COLUMN luggage SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN flight_nr SET NOT NULL;
commit;
`;

module.exports = {
    postgresStatement,
};