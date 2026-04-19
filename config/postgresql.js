const postgresStatement =
    `ALTER TABLE public.bookings ALTER COLUMN luggage SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN flight_nr SET NOT NULL;
commit;
`;

module.exports = {
    postgresStatement,
};