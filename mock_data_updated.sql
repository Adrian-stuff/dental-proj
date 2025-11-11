BEGIN;

-- First, clean up existing data
TRUNCATE TABLE history CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE records CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE doctors CASCADE;
TRUNCATE TABLE clinics CASCADE;
TRUNCATE TABLE case_types CASCADE;
TRUNCATE TABLE supply CASCADE;

-- Clinics
INSERT INTO clinics (clinic_id, clinic_name) VALUES
  (1, 'Dental Care Center'),
  (2, 'SmilePro Clinic'),
  (3, 'Tooth & Co.');

-- Doctors
INSERT INTO doctors (doctor_id, doctor_name, clinic_id) VALUES
  (1, 'Dr. Sarah Johnson', 1),
  (2, 'Dr. Michael Chen', 1),
  (3, 'Dr. Emily Santos', 2),
  (4, 'Dr. James Wilson', 2),
  (5, 'Dr. Maria Garcia', 3);

-- Case types
INSERT INTO case_types (case_type_id, case_type_name, number_of_cases) VALUES
  (1, 'Crown', 1),
  (2, 'Bridge', 1),
  (3, 'Denture', 1),
  (4, 'Implant', 1),
  (5, 'Veneer', 1);

-- Orders with specific payment statuses (paid/unpaid)
INSERT INTO orders (order_id, order_date, order_total, paid_amount, excess_payment, payment_method) VALUES
  -- Paid orders (paid_amount >= order_total)
  (1, '2025-11-01', 1500.00, 1500.00, 0.00, 'cash'),
  (2, '2025-11-01', 2000.00, 2000.00, 0.00, 'card'),
  (3, '2025-11-02', 3000.00, 3000.00, 0.00, 'transfer'),
  (4, '2025-11-02', 2500.00, 2500.00, 0.00, 'cash'),
  (5, '2025-11-03', 1800.00, 1800.00, 0.00, 'card'),
  -- Unpaid orders (paid_amount < order_total)
  (6, '2025-11-03', 2000.00, 1000.00, 0.00, 'cash'),
  (7, '2025-11-04', 3000.00, 1500.00, 0.00, 'card'),
  (8, '2025-11-04', 2500.00, 0.00, 0.00, 'pending'),
  (9, '2025-11-05', 1800.00, 800.00, 0.00, 'cash'),
  (10, '2025-11-05', 2200.00, 1000.00, 0.00, 'transfer');

-- Records with specific remarks (finished/pending)
INSERT INTO records (record_id, order_id, date_pickup, time_pickup, date_dropoff, time_dropoff, doctor_id, patient_name, description, remarks) VALUES
  -- Finished records
  (1, 1, '2025-11-03', '10:00:00+08', '2025-11-01', '08:00:00+08', 1, 'John Smith', 'Crown installation', 'finished'),
  (2, 2, '2025-11-03', '11:00:00+08', '2025-11-01', '09:00:00+08', 2, 'Emma Davis', 'Bridge work', 'finished'),
  (3, 3, '2025-11-04', '14:00:00+08', '2025-11-02', '10:00:00+08', 3, 'David Brown', 'Full denture', 'finished'),
  (4, 4, '2025-11-04', '15:00:00+08', '2025-11-02', '11:00:00+08', 4, 'Sophie Miller', 'Implant procedure', 'finished'),
  (5, 5, '2025-11-05', '16:00:00+08', '2025-11-03', '13:00:00+08', 5, 'William Lee', 'Veneer application', 'finished'),
  -- Pending records
  (6, 6, NULL, NULL, '2025-11-03', '14:00:00+08', 1, 'Oliver Wilson', 'Crown preparation', 'pending'),
  (7, 7, NULL, NULL, '2025-11-04', '09:00:00+08', 2, 'Ava Thompson', 'Bridge fitting', 'pending'),
  (8, 8, NULL, NULL, '2025-11-04', '10:00:00+08', 3, 'Mia Anderson', 'Denture adjustment', 'pending'),
  (9, 9, NULL, NULL, '2025-11-05', '11:00:00+08', 4, 'Lucas Martin', 'Implant consultation', 'pending'),
  (10, 10, NULL, NULL, '2025-11-05', '13:00:00+08', 5, 'Isabella White', 'Veneer preparation', 'pending');

-- Order items
INSERT INTO order_items (order_item_id, order_id, up_or_down, case_type_id, case_no, item_cost, item_quantity, order_description) VALUES
  (1, 1, 'up', 1, 1, 1500.00, 1, 'Porcelain Crown'),
  (2, 2, 'up', 2, 1, 2000.00, 1, '3-Unit Bridge'),
  (3, 3, 'up', 3, 1, 3000.00, 1, 'Complete Denture'),
  (4, 4, 'up', 4, 1, 2500.00, 1, 'Single Implant'),
  (5, 5, 'up', 5, 1, 1800.00, 1, 'Porcelain Veneer'),
  (6, 6, 'up', 1, 2, 2000.00, 1, 'Zirconia Crown'),
  (7, 7, 'up', 2, 2, 3000.00, 1, '4-Unit Bridge'),
  (8, 8, 'up', 3, 2, 2500.00, 1, 'Partial Denture'),
  (9, 9, 'up', 4, 2, 1800.00, 1, 'Implant Crown'),
  (10, 10, 'up', 5, 2, 2200.00, 1, 'Composite Veneer');

-- Supply records
INSERT INTO supply (supply_id, supply_date, supply_cost, supply_description) VALUES
  (1, '2025-11-01', 500.00, 'Crown materials'),
  (2, '2025-11-02', 800.00, 'Bridge components'),
  (3, '2025-11-03', 600.00, 'Implant supplies'),
  (4, '2025-11-04', 400.00, 'Impression materials'),
  (5, '2025-11-05', 300.00, 'General supplies');

-- Reset sequences
SELECT setval(pg_get_serial_sequence('clinics', 'clinic_id'), (SELECT MAX(clinic_id) FROM clinics));
SELECT setval(pg_get_serial_sequence('doctors', 'doctor_id'), (SELECT MAX(doctor_id) FROM doctors));
SELECT setval(pg_get_serial_sequence('case_types', 'case_type_id'), (SELECT MAX(case_type_id) FROM case_types));
SELECT setval(pg_get_serial_sequence('orders', 'order_id'), (SELECT MAX(order_id) FROM orders));
SELECT setval(pg_get_serial_sequence('records', 'record_id'), (SELECT MAX(record_id) FROM records));
SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), (SELECT MAX(order_item_id) FROM order_items));
SELECT setval(pg_get_serial_sequence('order_items', 'case_no'), (SELECT MAX(case_no) FROM order_items));
SELECT setval(pg_get_serial_sequence('supply', 'supply_id'), (SELECT MAX(supply_id) FROM supply));

COMMIT;