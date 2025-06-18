/*
  # Sample Data for Doctor Connect System

  This migration adds sample data for:
  1. Doctors
  2. Appointments
  3. Transactions
  4. Feedback
*/

-- Sample doctors data
INSERT INTO public.doctors (user_id, specialization, experience_years, fee, bio, is_online, rating, rating_count)
VALUES
  (1, 'Cardiology', 12, 150, 'Experienced cardiologist specializing in heart disease prevention and treatment.', true, 4.9, 120),
  (2, 'Neurology', 15, 180, 'Neurologist with expertise in headache disorders and stroke management.', false, 4.7, 95),
  (3, 'Pediatrics', 8, 120, 'Compassionate pediatrician providing comprehensive care for children of all ages.', true, 4.8, 210),
  (4, 'Orthopedics', 10, 160, 'Orthopedic surgeon specializing in sports injuries and joint replacements.', true, 4.6, 85),
  (5, 'Dermatology', 7, 140, 'Dermatologist treating both medical and cosmetic skin conditions.', false, 4.5, 110);

-- Sample appointments data
INSERT INTO public.appointments (doctor_id, doctor_name, patient_id, patient_name, appointment_date, appointment_time, status, type, fee, notes, meeting_id)
VALUES
  (1, 'Dr. John Smith', 6, 'Alice Johnson', '2025-06-25', '10:00:00', 'pending', 'Consultation', 150, 'Initial consultation for chest pain', NULL),
  (1, 'Dr. John Smith', 7, 'Bob Williams', '2025-06-24', '14:30:00', 'accepted', 'Follow-up', 120, 'Follow-up on medication adjustment', NULL),
  (2, 'Dr. Sarah Lee', 6, 'Alice Johnson', '2025-06-23', '11:00:00', 'completed', 'Consultation', 180, 'Headache evaluation', 'abc123xyz'),
  (3, 'Dr. Michael Chen', 8, 'Carol Davis', '2025-06-26', '09:15:00', 'paid', 'Emergency', 200, 'Sudden fever in child', 'def456uvw'),
  (4, 'Dr. Emily Wilson', 7, 'Bob Williams', '2025-06-22', '16:00:00', 'rejected', 'Consultation', 160, 'Knee pain assessment', NULL);

-- Sample transactions data
INSERT INTO public.transactions (doctor_id, patient_id, patient_name, amount, type, transaction_hash, description)
VALUES
  (3, 8, 'Carol Davis', 200.00, 'received', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'Emergency consultation payment'),
  (2, 6, 'Alice Johnson', 180.00, 'received', '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'Consultation payment'),
  (1, 7, 'Bob Williams', 120.00, 'received', '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456', 'Follow-up appointment payment');

-- Sample feedback data
INSERT INTO public.feedback (doctor_id, patient_id, appointment_id, rating, comment, is_anonymous)
VALUES
  (2, 6, (SELECT id FROM public.appointments WHERE doctor_id = 2 AND patient_id = 6 LIMIT 1), 5, 'Dr. Lee was very thorough and took the time to explain everything clearly.', false),
  (3, 8, (SELECT id FROM public.appointments WHERE doctor_id = 3 AND patient_id = 8 LIMIT 1), 4, 'Good experience overall. Dr. Chen was great with my child.', false);