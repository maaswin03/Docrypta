create table public.users (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone not null default now(),
  
  -- Common fields
  full_name text not null,
  email text not null unique,
  password text not null,
  wallet_address text not null,
  user_type text not null check (user_type in ('doctor', 'patient')),

  -- Doctor-specific (optional for patients)
  medical_license_url text,
  hospital_affiliation_url text,
  govt_id_url text,
  is_verified boolean not null default false,
  specialization text,
  reg_id text,

  -- Patient-specific (optional for doctors)
  age integer,
  phone_number text,
  gender text,
  device_id text
);


create table public.vitals_data (
  id uuid not null default gen_random_uuid (),
  device_id text not null,
  timestamp timestamp with time zone not null,
  heart_rate integer null,
  spo2 integer null,
  temperature numeric null,
  systolic_bp integer null,
  diastolic_bp integer null,
  respiratory_rate integer null,
  glucose_level numeric null,
  ecg_data jsonb null,
  created_at timestamp with time zone null default now(),
  activity_level jsonb null,
  user_id bigint not null,
  constraint vitals_data_pkey primary key (id)
) TABLESPACE pg_default;