BEGIN;

-- Clinics
INSERT INTO clinics (clinic_id, clinic_name) VALUES
  (1, 'Main Clinic'),
  (2, 'Branch A'),
  (3, 'Branch B');

-- Doctors
INSERT INTO doctors (doctor_id, doctor_name, clinic_id) VALUES
  (1, 'Dr. Maria Lopez', 1),
  (2, 'Dr. Jose Ramirez', 1),
  (3, 'Dr. Ana Cruz', 2),
  (4, 'Dr. Mark Santos', 3);

-- Case types
INSERT INTO case_types (case_type_id, case_type_name, number_of_cases) VALUES
  (1, 'Crown', 1),
  (2, 'Bridge', 1),
  (3, 'Filling', 1),
  (4, 'Veneer', 1);

-- Orders (some fully paid, some partially paid, some unpaid)
INSERT INTO orders (order_id, order_date, order_total, paid_amount, excess_payment, payment_method) VALUES
  (10, '2025-10-05', 1500.00, 1500.00, NULL, 'cash'),
  (11, '2025-10-06', 2500.00, 1000.00, NULL, 'card'),
  (12, '2025-10-13', 3000.00, 3000.00, NULL, 'transfer'),
  (13, '2025-10-20', 2000.00, 0.00, NULL, 'cash'),
  (14, '2025-10-22', 1200.50, 1200.50, NULL, 'card'),
  (15, '2025-10-25', 800.00, 400.00, NULL, 'cash');

-- Records (linking orders to doctors + dropoff/pickup dates & patient names)
INSERT INTO records (record_id, order_id, date_pickup, time_pickup, date_dropoff, time_dropoff, doctor_id, patient_name, description, remarks) VALUES
  (100, 10, '2025-10-07', '09:30:00+08', '2025-10-05', '08:30:00+08', 1, 'Alice Santos', 'Routine crown', NULL),
  (101, 11, '2025-10-08', '10:00:00+08', '2025-10-06', '09:45:00+08', 2, 'Bernard Cruz', 'Bridge preparation', 'Follow-up required'),
  (102, 12, '2025-10-15', '11:15:00+08', '2025-10-13', '10:00:00+08', 3, 'Carla Reyes', 'Full treatment', NULL),
  (103, 13, '2025-10-22', '14:00:00+08', '2025-10-20', '13:30:00+08', 4, 'Dina Lopez', 'Filling and check', NULL),
  (104, 14, '2025-10-23', '15:00:00+08', '2025-10-22', '14:30:00+08', 1, 'Ethan Gomez', 'Veneer work', NULL),
  (105, 15, '2025-10-27', '16:00:00+08', '2025-10-25', '15:30:00+08', 2, 'Fiona Cruz', 'Minor filling', 'Insurance partial');

-- Order items (linking to orders and case types)
INSERT INTO order_items (order_item_id, order_id, up_or_down, case_type_id, case_no, item_cost, item_quantity, order_description) VALUES
  (1000, 10, 'up', 1, 1, 1500.00, 1, 'Crown (zirconia)'),
  (1001, 11, 'up', 2, 1, 2000.00, 1, 'Bridge (3-unit)'),
  (1002, 11, 'down', 3, 2, 500.00, 1, 'Temporary restoration'),
  (1003, 12, 'up', 1, 1, 3000.00, 1, 'Full crown set'),
  (1004, 13, 'up', 3, 1, 2000.00, 1, 'Filling (composite)'),
  (1005, 14, 'up', 4, 1, 1200.50, 1, 'Veneer (porcelain)'),
  (1006, 15, 'up', 3, 1, 800.00, 1, 'Filling (amalgam)');

-- Supplies
INSERT INTO supply (supply_id, supply_date, supply_cost, supply_description) VALUES
  (500, '2025-10-05', 250.00, 'Gloves and disposables'),
  (501, '2025-10-06', 500.00, 'Anesthetic vials'),
  (502, '2025-10-12', 300.00, 'Sutures and needles'),
  (503, '2025-10-20', 450.00, 'Dental cement'),
  (504, '2025-10-25', 150.00, 'Polishing burs');

-- History (images left NULL; use actual bytea data if you want to store images)
INSERT INTO history (history_id, history_type, history_date, history_time, record_id, image_data) VALUES
  (900, 'photo', '2025-10-05', '08:35:00+08', 100, NULL),
  (901, 'xray', '2025-10-06', '09:50:00+08', 101, NULL),
  (902, 'photo', '2025-10-13', '10:05:00+08', 102, NULL);

-- Sync serial sequences to current max values so next inserts don't conflict
SELECT setval(pg_get_serial_sequence('clinics','clinic_id'), COALESCE((SELECT MAX(clinic_id) FROM clinics), 1), true);
SELECT setval(pg_get_serial_sequence('doctors','doctor_id'), COALESCE((SELECT MAX(doctor_id) FROM doctors), 1), true);
SELECT setval(pg_get_serial_sequence('case_types','case_type_id'), COALESCE((SELECT MAX(case_type_id) FROM case_types), 1), true);
SELECT setval(pg_get_serial_sequence('orders','order_id'), COALESCE((SELECT MAX(order_id) FROM orders), 1), true);
SELECT setval(pg_get_serial_sequence('records','record_id'), COALESCE((SELECT MAX(record_id) FROM records), 1), true);
SELECT setval(pg_get_serial_sequence('order_items','order_item_id'), COALESCE((SELECT MAX(order_item_id) FROM order_items), 1), true);
SELECT setval(pg_get_serial_sequence('order_items','case_no'), COALESCE((SELECT MAX(case_no) FROM order_items), 1), true);
SELECT setval(pg_get_serial_sequence('supply','supply_id'), COALESCE((SELECT MAX(supply_id) FROM supply), 1), true);
SELECT setval(pg_get_serial_sequence('history','history_id'), COALESCE((SELECT MAX(history_id) FROM history), 1), true);

COMMIT;
