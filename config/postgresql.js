const postgresStatement =
    `ALTER TABLE public.bookings ALTER COLUMN flight_nr DROP NOT NULL;
    ALTER TABLE public.bookings ALTER COLUMN luggage DROP NOT NULL;
    commit;
`;

module.exports = {
    postgresStatement,
};