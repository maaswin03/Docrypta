/*
  # Doctor Connect System Tables

  1. New Tables
    - `doctors` - Extended information for doctors
    - `appointments` - Appointment bookings between doctors and patients
    - `transactions` - Payment records for consultations
    - `feedback` - Patient feedback for doctors after consultations

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Doctors table with extended information
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES public.users(id),
  specialization text NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  fee numeric NOT NULL DEFAULT 0,
  bio text,
  is_online boolean DEFAULT false,
  rating numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id bigint NOT NULL REFERENCES public.users(id),
  doctor_name text NOT NULL,
  patient_id bigint NOT NULL REFERENCES public.users(id),
  patient_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'paid', 'completed')),
  type text NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  notes text,
  meeting_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id bigint NOT NULL REFERENCES public.users(id),
  patient_id bigint REFERENCES public.users(id),
  patient_name text,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('sent', 'received')),
  transaction_hash text,
  description text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id bigint NOT NULL REFERENCES public.users(id),
  patient_id bigint NOT NULL REFERENCES public.users(id),
  appointment_id uuid REFERENCES public.appointments(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies for doctors table
CREATE POLICY "Doctors can view and update their own profile"
  ON public.doctors
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Everyone can view doctor profiles"
  ON public.doctors
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for appointments
CREATE POLICY "Doctors can view their own appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = doctor_id::text);

CREATE POLICY "Patients can view their own appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = patient_id::text);

CREATE POLICY "Patients can create appointments"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = patient_id::text);

-- Policies for transactions
CREATE POLICY "Doctors can view their own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = doctor_id::text);

CREATE POLICY "Patients can view their own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = patient_id::text);

-- Policies for feedback
CREATE POLICY "Doctors can view feedback about them"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = doctor_id::text);

CREATE POLICY "Patients can view and create feedback they gave"
  ON public.feedback
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = patient_id::text)
  WITH CHECK (auth.uid()::text = patient_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_doctor_id ON public.transactions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_patient_id ON public.transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_doctor_id ON public.feedback(doctor_id);