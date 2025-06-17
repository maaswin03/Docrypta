export interface ValidationError {
  field: string
  message: string
}

export function validateEmail(email: string): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    return { field: "email", message: "Email is required" }
  }
  if (!emailRegex.test(email)) {
    return { field: "email", message: "Please enter a valid email address" }
  }
  return null
}

export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: "password", message: "Password is required" }
  }
  if (password.length < 8) {
    return { field: "password", message: "Password must be at least 8 characters long" }
  }
  return null
}

export function validateFullName(fullName: string): ValidationError | null {
  if (!fullName) {
    return { field: "fullName", message: "Full name is required" }
  }
  if (fullName.length < 2) {
    return { field: "fullName", message: "Full name must be at least 2 characters long" }
  }
  return null
}

export function validatePhoneNumber(phoneNumber: string): ValidationError | null {
  const phoneRegex = /^[0-9]{10}$/
  if (!phoneNumber) {
    return { field: "phoneNumber", message: "Phone number is required" }
  }
  if (!phoneRegex.test(phoneNumber)) {
    return { field: "phoneNumber", message: "Please enter a valid 10-digit phone number" }
  }
  return null
}

export function validateAge(age: number): ValidationError | null {
  if (!age) {
    return { field: "age", message: "Age is required" }
  }
  if (age < 1 || age > 120) {
    return { field: "age", message: "Please enter a valid age between 1 and 120" }
  }
  return null
}

export function validateDoctorFields(data: {
  specialization: string
  regId: string
}): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.specialization) {
    errors.push({ field: "specialization", message: "Medical specialization is required" })
  }

  if (!data.regId) {
    errors.push({ field: "regId", message: "Registration ID is required" })
  }

  return errors
}

export function validatePatientFields(data: {
  age: number
  phoneNumber: string
  gender: string
}): ValidationError[] {
  const errors: ValidationError[] = []

  const ageError = validateAge(data.age)
  if (ageError) errors.push(ageError)

  const phoneError = validatePhoneNumber(data.phoneNumber)
  if (phoneError) errors.push(phoneError)

  if (!data.gender) {
    errors.push({ field: "gender", message: "Gender is required" })
  }

  return errors
}
