/*
  # Seed data for doctor functionality

  This migration adds sample data for:
  - Appointments
  - Transactions
  - Feedback
*/

-- Sample appointments
INSERT INTO public.appointments (doctor_id, patient_id, patient_name, appointment_date, appointment_time, status, type, notes)
VALUES
  (1, 2, 'John Smith', '2025-06-25', '10:00:00', 'pending', 'Consultation', 'Initial consultation for chronic back pain'),
  (1, 3, 'Sarah Johnson', '2025-06-25', '14:00:00', 'accepted', 'Follow-up', 'Follow-up on medication effectiveness'),
  (1, 4, 'Michael Brown', '2025-06-24', '11:30:00', 'completed', 'Consultation', 'Discussed treatment options'),
  (1, 5, 'Emily Davis', '2025-06-26', '09:15:00', 'pending', 'Emergency', 'Sudden chest pain'),
  (1, 6, 'Robert Wilson', '2025-06-23', '16:00:00', 'completed', 'Follow-up', 'Review of lab results');

-- Sample transactions
INSERT INTO public.transactions (doctor_id, patient_id, patient_name, amount, type, transaction_hash, description)
VALUES
  (1, 2, 'John Smith', 150.00, 'received', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'Initial consultation'),
  (1, 3, 'Sarah Johnson', 100.00, 'received', '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'Follow-up appointment'),
  (1, 4, 'Michael Brown', 200.00, 'received', '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456', 'Comprehensive evaluation'),
  (1, NULL, 'Medical Supplies Inc.', 50.00, 'sent', '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab', 'Office supplies'),
  (1, 6, 'Robert Wilson', 125.00, 'received', '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234', 'Follow-up and prescription');

-- Sample feedback
INSERT INTO public.feedback (doctor_id, patient_id, rating, comment, is_anonymous)
VALUES
  (1, 2, 5, 'Dr. was very thorough and took the time to explain everything clearly.', false),
  (1, 3, 4, 'Good experience overall. Wait time was a bit long.', false),
  (1, 4, 5, 'Excellent care and very knowledgeable.', false),
  (1, 5, 3, 'Decent service but felt rushed during the appointment.', true),
  (1, 6, 5, 'Very professional and caring. Highly recommend!', false);