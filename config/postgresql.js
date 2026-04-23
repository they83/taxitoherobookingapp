const postgresStatement =
    `
        UPDATE public.prices SET price=1 WHERE distance=1;
        UPDATE public.prices SET price=1 WHERE distance=2;
        UPDATE public.prices SET price=1 WHERE distance=3;
        UPDATE public.prices SET price=1 WHERE distance=4;
        UPDATE public.prices SET price=1 WHERE distance=5;
        UPDATE public.prices SET price=1 WHERE distance=6;
        UPDATE public.prices SET price=1 WHERE distance=7;
        UPDATE public.prices SET price=1 WHERE distance=8;
        UPDATE public.prices SET price=1 WHERE distance=9;
        UPDATE public.prices SET price=1 WHERE distance=10;
        UPDATE public.prices SET price=1 WHERE distance=11;
        UPDATE public.prices SET price=1 WHERE distance=12;
        UPDATE public.prices SET price=1 WHERE distance=13;
        UPDATE public.prices SET price=1 WHERE distance=14;
        UPDATE public.prices SET price=1 WHERE distance=15;
        UPDATE public.prices SET price=1 WHERE distance=16;
        UPDATE public.prices SET price=1 WHERE distance=17;
        UPDATE public.prices SET price=1 WHERE distance=18;
        UPDATE public.prices SET price=1 WHERE distance=19;
        UPDATE public.prices SET price=1 WHERE distance=20;
        UPDATE public.prices SET price=1 WHERE distance=21;
        UPDATE public.prices SET price=1 WHERE distance=22;
        UPDATE public.prices SET price=1 WHERE distance=23;
        UPDATE public.prices SET price=1 WHERE distance=24;
        UPDATE public.prices SET price=1 WHERE distance=25;
        UPDATE public.prices SET price=1 WHERE distance=26;
        UPDATE public.prices SET price=1 WHERE distance=27;
        UPDATE public.prices SET price=1 WHERE distance=28;
        UPDATE public.prices SET price=1 WHERE distance=29;
    commit;
`;

module.exports = {
    postgresStatement,
};