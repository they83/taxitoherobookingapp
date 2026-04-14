-- PostgreSQL Database Setup for WhatsApp Taxi Booking System
-- Run these commands in your PostgreSQL database

-- Create database (run this as postgres user)
CREATE DATABASE taxi_booking;

-- Connect to the taxi_booking database before running the rest
\c taxi_booking;

-- Create bookings table
CREATE TABLE bookings
(
    id                    SERIAL PRIMARY KEY,
    phone_number          VARCHAR(20)        NOT NULL,
    alternative_phone_number          VARCHAR(20)        NULL,
    customer_name         VARCHAR(255)       NOT NULL,
    date                  VARCHAR(20)        NOT NULL,
    time                  time               NOT NULL,
    distance_to_airport   int4               NOT NULL,
    duration_to_airport   int4               NOT NULL,
    distance_from_airport int4               NOT NULL,
    duration_from_airport int4               NOT NULL,
    address               varchar            NOT NULL,
    selected_option       varchar            NOT NULL,
    language              varchar            NOT NULL,
    passengers            INTEGER            NOT NULL DEFAULT 1,
    price                 INTEGER,
    status                VARCHAR(20)        NOT NULL DEFAULT 'pending'
        CHECK (status IN
               ('pending', 'payment_pending', 'paid', 'confirmed', 'cancelled', 'payment_failed', 'completed')),
    mpesa_checkout_id     VARCHAR(100),
    mpesa_transaction_id  VARCHAR(100),
    booking_reference     VARCHAR(50) UNIQUE NOT NULL,
    extra_info            TEXT,
    flight_nr             varchar            NOT NULL,
    luggage               varchar            NOT NULL,
    created_at            TIMESTAMP WITH TIME ZONE    DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP WITH TIME ZONE    DEFAULT CURRENT_TIMESTAMP
);

-- Create conversations table for bot state management
CREATE TABLE conversations
(
    id                SERIAL PRIMARY KEY,
    phone_number      VARCHAR(20) NOT NULL,
    current_state     VARCHAR(50) NOT NULL     DEFAULT 'welcome',
    context           JSONB                    DEFAULT '{}',
    booking_reference varchar(50) NULL,
    last_activity     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table for customer information
CREATE TABLE customers
(
    id                 SERIAL PRIMARY KEY,
    phone_number       VARCHAR(20) NOT NULL UNIQUE,
    name               VARCHAR(255),
    email              VARCHAR(100),
    preferred_location VARCHAR(100),
    total_bookings     INTEGER                  DEFAULT 0,
    total_spent        DECIMAL(12, 2)           DEFAULT 0,
    last_booking_date  DATE,
    is_vip             BOOLEAN                  DEFAULT false,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_logs table for tracking all payment attempts
CREATE TABLE payment_logs
(
    id                   SERIAL PRIMARY KEY,
    booking_id           INTEGER        NOT NULL,
    phone_number         VARCHAR(20)    NOT NULL,
    amount               DECIMAL(10, 2) NOT NULL,
    mpesa_checkout_id    VARCHAR(100),
    mpesa_transaction_id VARCHAR(100),
    status               VARCHAR(20)    NOT NULL,
    response_code        VARCHAR(10),
    response_description TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
);

-- create price mapping table
CREATE TABLE public.prices
(
    distance int4 NOT NULL,
    price    int4 NULL,
    CONSTRAINT prices_pk PRIMARY KEY (distance)
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_phone_number ON bookings (phone_number);
CREATE INDEX idx_bookings_date ON bookings (date);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_mpesa_checkout ON bookings (mpesa_checkout_id);
CREATE INDEX idx_conversations_phone_number ON conversations (phone_number);
CREATE INDEX idx_customers_phone_number ON customers (phone_number);

-- Create function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference() RETURNS TEXT AS
$$
BEGIN
    RETURN 'HB' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('booking_ref_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for booking reference
CREATE SEQUENCE booking_ref_seq START 1;

-- Create trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference() RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.booking_reference IS NULL THEN
        NEW.booking_reference := generate_booking_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_reference_trigger
    BEFORE INSERT
    ON bookings
    FOR EACH ROW
EXECUTE FUNCTION set_booking_reference();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE
    ON bookings
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE
    ON customers
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Grant necessary permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Display setup completion message
SELECT 'Database setup completed successfully!' as message;