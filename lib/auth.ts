import { supabase } from "./supabaseClient"
import bcrypt from "bcryptjs"

export interface SignupData {
  fullName: string
  email: string
  password: string
  userType: "doctor" | "user"
  walletAddress?: string

  
  specialization?: string
  regId?: string
  medicalLicenseUrl?: string
  hospitalAffiliationUrl?: string
  govtIdUrl?: string

  
  age?: number
  phoneNumber?: string
  gender?: string
  deviceId?: string
}

export interface SigninData {
  email: string
  password: string
}

export interface WalletSigninData {
  walletAddress: string
}

export async function signupUser(data: SignupData) {
  try {
    
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", data.email)
      .single()

    if (existingUser) {
      throw new Error("An account with this email already exists")
    }

    
    const hashedPassword = await bcrypt.hash(data.password, 12)

    
    const userData = {
      full_name: data.fullName,
      email: data.email,
      password: hashedPassword,
      user_type: data.userType,
      wallet_address: data.walletAddress || null,

      
      specialization: data.userType === "doctor" ? data.specialization : null,
      reg_id: data.userType === "doctor" ? data.regId : null,
      medical_license_url: data.userType === "doctor" ? data.medicalLicenseUrl : null,
      hospital_affiliation_url: data.userType === "doctor" ? data.hospitalAffiliationUrl : null,
      govt_id_url: data.userType === "doctor" ? data.govtIdUrl : null,
      is_verified: false, 

      
      age: data.userType === "user" ? data.age : null,
      phone_number: data.userType === "user" ? data.phoneNumber : null,
      gender: data.userType === "user" ? data.gender : null,
      device_id: data.userType === "user" ? data.deviceId : null,
    }

    const { data: newUser, error } = await supabase.from("users").insert([userData]).select().single()

    if (error) {
      throw new Error(error.message)
    }

    return { user: newUser, success: true }
  } catch (error) {
    return {
      user: null,
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

export async function signinUser(data: SigninData) {
  try {
    
    const { data: user, error } = await supabase.from("users").select("*").eq("email", data.email).single()

    if (error || !user) {
      throw new Error("Invalid email or password")
    }

    
    const isPasswordValid = await bcrypt.compare(data.password, user.password)

    if (!isPasswordValid) {
      throw new Error("Invalid email or password")
    }

    
    if (user.user_type === "doctor" && !user.is_verified) {
      throw new Error("Your doctor account is pending verification. Please wait for admin approval.")
    }

    
    const { password, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      success: true,
    }
  } catch (error) {
    return {
      user: null,
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

export async function signinWithWallet(data: WalletSigninData) {
  try {
    
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", data.walletAddress)
      .single()

    if (error || !user) {
      throw new Error("No account found with this wallet address. Please sign up first.")
    }

    
    if (user.user_type === "doctor" && !user.is_verified) {
      throw new Error("Your doctor account is pending verification. Please wait for admin approval.")
    }

    
    const { password, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      success: true,
    }
  } catch (error) {
    return {
      user: null,
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
