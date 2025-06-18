import { NextResponse } from 'next/server'

// This would normally be stored in environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here'

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json()

    // For demo purposes, we'll simulate the OpenAI API response
    // In a production app, you would make an actual API call to OpenAI
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create a context from the message history
    const context = history.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')
    
    // Generate a response based on the message content
    let response = ''
    
    if (message.toLowerCase().includes('headache') || message.toLowerCase().includes('head pain')) {
      response = "Headaches can have various causes including stress, dehydration, lack of sleep, or tension. For mild headaches, try drinking water, resting in a quiet dark room, and applying a cold or warm compress. If headaches are severe, frequent, or accompanied by other symptoms like fever, vision changes, or neck stiffness, please consult a healthcare professional immediately."
    } 
    else if (message.toLowerCase().includes('fever') || message.toLowerCase().includes('temperature')) {
      response = "Fever is often a sign that your body is fighting an infection. For adults, a fever is generally considered 100.4°F (38°C) or higher. Stay hydrated, rest, and consider over-the-counter fever reducers if comfortable. Seek medical attention if fever exceeds 103°F (39.4°C), persists for more than 3 days, or is accompanied by severe symptoms."
    }
    else if (message.toLowerCase().includes('cough') || message.toLowerCase().includes('cold')) {
      response = "Coughs can be caused by viral infections, allergies, or irritants. For a dry cough, try honey, warm liquids, and throat lozenges. For productive coughs, stay hydrated to help thin mucus. See a doctor if the cough persists for more than 2 weeks, produces blood, or is accompanied by high fever or difficulty breathing."
    }
    else if (message.toLowerCase().includes('diet') || message.toLowerCase().includes('nutrition') || message.toLowerCase().includes('food')) {
      response = "A balanced diet should include a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. Aim for 5-9 servings of fruits and vegetables daily, stay hydrated with water, and limit processed foods, added sugars, and excessive sodium. Consider consulting a registered dietitian for personalized nutrition advice."
    }
    else if (message.toLowerCase().includes('exercise') || message.toLowerCase().includes('workout') || message.toLowerCase().includes('fitness')) {
      response = "Regular physical activity is crucial for health. Adults should aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous activity weekly, plus muscle-strengthening activities twice a week. Start slowly if you're new to exercise and gradually increase intensity. Consult your doctor before starting a new exercise program, especially if you have health conditions."
    }
    else if (message.toLowerCase().includes('sleep') || message.toLowerCase().includes('insomnia') || message.toLowerCase().includes('tired')) {
      response = "Good sleep hygiene is essential for health. Adults need 7-9 hours of sleep nightly. Maintain a consistent sleep schedule, create a comfortable sleep environment, avoid screens before bedtime, and limit caffeine late in the day. If you consistently have trouble sleeping, consider speaking with a healthcare provider about possible sleep disorders."
    }
    else if (message.toLowerCase().includes('stress') || message.toLowerCase().includes('anxiety') || message.toLowerCase().includes('mental health')) {
      response = "Managing stress is important for overall health. Try relaxation techniques like deep breathing, meditation, or yoga. Regular exercise, adequate sleep, and social support can also help. If stress or anxiety significantly impacts your daily life, consider speaking with a mental health professional. Remember, seeking help is a sign of strength, not weakness."
    }
    else if (message.toLowerCase().includes('blood pressure') || message.toLowerCase().includes('hypertension')) {
      response = "Normal blood pressure is typically around 120/80 mmHg. High blood pressure (hypertension) is generally considered 130/80 mmHg or higher. To maintain healthy blood pressure, consider reducing sodium intake, exercising regularly, maintaining a healthy weight, limiting alcohol, avoiding tobacco, and managing stress. Regular monitoring is important, especially if you have risk factors or a family history of hypertension."
    }
    else if (message.toLowerCase().includes('diabetes') || message.toLowerCase().includes('blood sugar')) {
      response = "Diabetes management involves monitoring blood sugar levels, taking medications as prescribed, following a balanced diet, regular physical activity, and attending regular check-ups. Normal fasting blood sugar is below 100 mg/dL. If you're experiencing symptoms like increased thirst, frequent urination, unexplained weight loss, or fatigue, consult with a healthcare provider for proper evaluation."
    }
    else {
      response = "Thank you for your health question. While I can provide general health information, I recommend consulting with a qualified healthcare professional for personalized medical advice, especially for specific symptoms or conditions. Is there a particular aspect of health and wellness you'd like to know more about?"
    }

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error('Error processing chat request:', error)
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    )
  }
}