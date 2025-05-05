-- Drop tables in the correct order to satisfy dependencies
DROP TABLE IF EXISTS history CASCADE; -- Drop history first, as it depends on records
DROP TABLE IF EXISTS records CASCADE; -- Drop records next, as both history and other tables depend on it.
DROP TABLE IF EXISTS doctors CASCADE; -- Drop doctors, which depends on clinics
DROP TABLE IF EXISTS clinics CASCADE; -- Drop clinics last, as it is depended on by doctors.


-- Table for Clinics
CREATE TABLE clinics (
    clinic_id SERIAL PRIMARY KEY,
    clinic_name VARCHAR(255) NOT NULL UNIQUE
);

-- Table for Doctors
CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    doctor_name VARCHAR(255) NOT NULL,
    clinic_id INTEGER REFERENCES clinics(clinic_id)
);

-- Table for Records
CREATE TABLE records (
    record_id SERIAL PRIMARY KEY,
    case_type TEXT,
    case_no SERIAL,
    date_pickup DATE,
	time_pickup TIME WITH TIME ZONE,
	date_dropoff DATE,
	time_dropoff TIME WITH TIME ZONE,
    doctor_name VARCHAR(255) NOT NULL,
    clinic_name VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2),
    excess_payment DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for History
CREATE TABLE history (
    history_id SERIAL PRIMARY KEY,
    history_type VARCHAR(255) NOT NULL,
    history_date DATE,
	history_time TIME WITH TIME ZONE DEFAULT CURRENT_TIME,
    record_id INTEGER NOT NULL,
	image_data BYTEA
);


-- Optional indexes for faster lookups
CREATE INDEX idx_records_patient_name ON records (patient_name);
CREATE INDEX idx_records_date_pickup ON records (date_pickup);
CREATE INDEX idx_records_doctor_name ON records (doctor_name);
CREATE INDEX idx_records_clinic_name ON records (clinic_name);

-- Sample Data Insertion
INSERT INTO clinics (clinic_name)
VALUES
    ('St. Jude Clinic'),
    ('Metro Medical Center');

INSERT INTO doctors (doctor_name, clinic_id)
VALUES
    ('Dr. Ana Reyes', (SELECT clinic_id FROM clinics WHERE clinic_name = 'St. Jude Clinic')),
    ('Dr. Ben Cruz', (SELECT clinic_id FROM clinics WHERE clinic_name = 'St. Jude Clinic')),
    ('Dr. Carla Diaz', (SELECT clinic_id FROM clinics WHERE clinic_name = 'Metro Medical Center'));

-- Modified INSERT INTO records to use clinic and doctor names directly.
INSERT INTO records (case_type, date_pickup, doctor_name, clinic_name, patient_name, total_amount, paid_amount)
VALUES
    ('Consultation', '2025-05-04', 'Dr. Ana Reyes', 'St. Jude Clinic', 'Juan Dela Cruz', 1500.00, 1500.00),
    ('Follow-up', '2025-05-10', 'Dr. Ben Cruz', 'St. Jude Clinic', 'Maria Santos', 800.00, 1000.00),
    ('Check-up', '2025-05-15', 'Dr. Carla Diaz', 'Metro Medical Center', 'Ricardo Gomez', 1200.00, 1000.00);

-- Updating excess payment based on paid and total amount
UPDATE records
SET excess_payment = paid_amount - total_amount;
