/*
  # Create tables for doctor functionality

  1. New Tables
    - `appointments` - Stores patient appointments with doctors
    - `transactions` - Stores payment transactions
    - `feedback` - Stores patient feedback for doctors
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  doctor_id bigint NOT NULL REFERENCES public.users(id),
  patient_id bigint NOT NULL REFERENCES public.users(id),
  patient_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  type text NOT NULL,
  notes text,
  meeting_id text
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  doctor_id bigint NOT NULL REFERENCES public.users(id),
  patient_id bigint REFERENCES public.users(id),
  patient_name text,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('sent', 'received')),
  transaction_hash text,
  description text,
  status text DEFAULT 'completed'
);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  doctor_id bigint NOT NULL REFERENCES public.users(id),
  patient_id bigint NOT NULL REFERENCES public.users(id),
  appointment_id uuid REFERENCES public.appointments(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_anonymous boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

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

-- Policies for transactions
CREATE POLICY "Doctors can view their own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = doctor_id::text);

-- Policies for feedback
CREATE POLICY "Doctors can view feedback about them"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = doctor_id::text);

CREATE POLICY "Patients can view feedback they gave"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = patient_id::text);