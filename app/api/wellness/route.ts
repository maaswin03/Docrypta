import { NextResponse } from 'next/server'

// This would normally be stored in environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here'

export async function POST(request: Request) {
  try {
    const { vitals, symptoms } = await request.json()

    // For demo purposes, we'll simulate the OpenAI API response
    // In a production app, you would make an actual API call to OpenAI
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Create a prompt with the vitals data and symptoms
    const prompt = `
      You are a virtual healthcare assistant. Analyze these patient vitals and symptoms, then provide 
      a short, user-friendly wellness summary, noting any early signs of risk.
      
      Vitals: 
      - Heart Rate: ${vitals.heart_rate || 'N/A'} bpm
      - SpO2: ${vitals.spo2 || 'N/A'}%
      - Temperature: ${vitals.temperature || 'N/A'}°C
      - Blood Pressure: ${vitals.systolic_bp || 'N/A'}/${vitals.diastolic_bp || 'N/A'} mmHg
      - Glucose: ${vitals.glucose_level || 'N/A'} mg/dL
      - Respiratory Rate: ${vitals.respiratory_rate || 'N/A'} bpm
      
      Symptoms: ${symptoms || 'None reported'}
    `
    
    // Generate a response based on the vitals and symptoms
    let response = ""
    
    // Check for abnormal values and generate insights
    const abnormalities = []
    
    if (vitals.heart_rate && (vitals.heart_rate < 60 || vitals.heart_rate > 100)) {
      abnormalities.push("heart rate")
    }
    
    if (vitals.spo2 && vitals.spo2 < 95) {
      abnormalities.push("oxygen saturation")
    }
    
    if (vitals.temperature && (vitals.temperature < 36.1 || vitals.temperature > 37.2)) {
      abnormalities.push("body temperature")
    }
    
    if (vitals.systolic_bp && vitals.systolic_bp > 120) {
      abnormalities.push("systolic blood pressure")
    }
    
    if (vitals.diastolic_bp && vitals.diastolic_bp > 80) {
      abnormalities.push("diastolic blood pressure")
    }
    
    if (vitals.glucose_level && (vitals.glucose_level < 70 || vitals.glucose_level > 140)) {
      abnormalities.push("blood glucose")
    }
    
    if (vitals.respiratory_rate && (vitals.respiratory_rate < 12 || vitals.respiratory_rate > 20)) {
      abnormalities.push("respiratory rate")
    }
    
    const hasSymptoms = symptoms && symptoms.trim().length > 0
    
    if (abnormalities.length > 0 || hasSymptoms) {
      response = `
        ## Wellness Summary
        
        Based on your recent vital signs${hasSymptoms ? ' and reported symptoms' : ''}, I've noticed some potential areas that may need attention. ${abnormalities.length > 0 ? `Your ${abnormalities.join(", ")} ${abnormalities.length === 1 ? 'is' : 'are'} outside the typical range.` : ''}
        
        ### Recommendations:
        
        - Consider scheduling a follow-up with your healthcare provider to discuss these findings
        - Continue monitoring your vitals regularly
        - Maintain a balanced diet and stay hydrated
        - Ensure you're getting adequate rest and managing stress levels
        - Follow any medication regimens as prescribed by your doctor
        
        Remember that these insights are not a diagnosis, and variations in vital signs can occur for many normal reasons. Always consult with a healthcare professional for proper medical advice.
      `
    } else {
      response = `
        ## Wellness Summary
        
        Great news! Based on your recent vital signs, all your measurements appear to be within normal ranges. This suggests your body is functioning well from a physiological perspective.
        
        ### Recommendations to maintain your health:
        
        - Continue your current healthy habits
        - Stay hydrated by drinking plenty of water throughout the day
        - Maintain a balanced diet rich in fruits, vegetables, and whole grains
        - Aim for 7-9 hours of quality sleep each night
        - Engage in regular physical activity (at least 150 minutes of moderate exercise weekly)
        - Practice stress management techniques like meditation or deep breathing
        
        Remember to continue regular check-ups with your healthcare provider even when feeling well. Prevention and early detection are key components of long-term health.
      `
    }
    
    return NextResponse.json({ insights: response })
  } catch (error) {
    console.error('Error processing wellness insights request:', error)
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    )
  }
}