export interface UserData {
  id?: number
  created_at?: string
  full_name?: string
  email?: string
  age?: number
  device_id?: string
  gender?: string
  govt_id_url?: string | null
  hospital_affiliation_url?: string | null
  is_verified?: boolean
  medical_license_url?: string | null
  phone_number?: string
  reg_id?: string | null
  specialization?: string | null
  user_type?: "patient" | "doctor"
  wallet_address?: string
}

export class LocalStorageService {
  private static readonly USER_DATA_KEY = "user"

  static saveUserData(data: Partial<UserData>): void {
    if (typeof window === "undefined") return

    try {
      const existingData = this.getUserData()
      const updatedData = { ...existingData, ...data }
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(updatedData))
    } catch (error) {
      console.error("Failed to save user data to localStorage:", error)
    }
  }

  static getUserData(): UserData {
    if (typeof window === "undefined") return {}

    try {
      const data = localStorage.getItem(this.USER_DATA_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error("Failed to get user data from localStorage:", error)
      return {}
    }
  }

  static getUserId(): number | null {
    const userData = this.getUserData()
    return userData.id || null
  }

  static getDeviceId(): string | null {
    const userData = this.getUserData()
    return userData.device_id || null
  }

  static clearUserData(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(this.USER_DATA_KEY)
    } catch (error) {
      console.error("Failed to clear user data from localStorage:", error)
    }
  }

  static updateField(field: keyof UserData, value: string | number): void {
    const currentData = this.getUserData()
    this.saveUserData({ ...currentData, [field]: value })
  }
}
