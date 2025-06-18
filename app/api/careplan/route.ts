import { NextResponse } from 'next/server'

// This would normally be stored in environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here'

export async function POST(request: Request) {
  try {
    const { vitals, symptoms, planType } = await request.json()

    // For demo purposes, we'll simulate the OpenAI API response
    // In a production app, you would make an actual API call to OpenAI
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create a prompt with the vitals data and symptoms
    const prompt = `
      Based on these vitals and symptoms, generate a personalized ${planType || 'care'} plan.
      
      Vitals: 
      - Heart Rate: ${vitals.heart_rate || 'N/A'} bpm
      - SpO2: ${vitals.spo2 || 'N/A'}%
      - Temperature: ${vitals.temperature || 'N/A'}°C
      - Blood Pressure: ${vitals.systolic_bp || 'N/A'}/${vitals.diastolic_bp || 'N/A'} mmHg
      - Glucose: ${vitals.glucose_level || 'N/A'} mg/dL
      - Respiratory Rate: ${vitals.respiratory_rate || 'N/A'} bpm
      
      Symptoms: ${symptoms || 'None reported'}
    `
    
    // Generate a response based on the plan type
    let response = ""
    
    switch (planType) {
      case 'diet':
        response = `
          ## Personalized Diet Plan
          
          Based on your health data, here's a 7-day nutrition plan to support your wellbeing:
          
          ### General Guidelines:
          
          - Stay hydrated with 8-10 glasses of water daily
          - Focus on whole, unprocessed foods
          - Include a variety of colorful fruits and vegetables
          - Limit added sugars and sodium
          
          ### Daily Meal Structure:
          
          **Breakfast Options:**
          - Overnight oats with berries and chia seeds
          - Vegetable omelet with whole grain toast
          - Greek yogurt with fruits and nuts
          
          **Lunch Options:**
          - Quinoa bowl with roasted vegetables and lean protein
          - Mediterranean salad with olive oil dressing
          - Lentil soup with a side of mixed greens
          
          **Dinner Options:**
          - Baked fish with steamed vegetables and brown rice
          - Stir-fried tofu with broccoli and bell peppers
          - Grilled chicken with sweet potato and asparagus
          
          **Healthy Snacks:**
          - Apple slices with almond butter
          - Carrot sticks with hummus
          - Handful of mixed nuts and seeds
          
          ### Specific Recommendations:
          
          ${vitals.systolic_bp && vitals.systolic_bp > 120 ? '- Reduce sodium intake to help manage blood pressure\n- Include potassium-rich foods like bananas, spinach, and sweet potatoes\n' : ''}
          ${vitals.glucose_level && vitals.glucose_level > 100 ? '- Monitor carbohydrate intake and focus on low glycemic index foods\n- Include cinnamon and chromium-rich foods to help regulate blood sugar\n' : ''}
          ${vitals.heart_rate && vitals.heart_rate > 90 ? '- Include magnesium-rich foods like leafy greens, nuts, and whole grains\n- Consider reducing caffeine intake\n' : ''}
          
          Remember to consult with a registered dietitian for personalized nutrition advice tailored to your specific health needs.
        `
        break
        
      case 'exercise':
        response = `
          ## Personalized Exercise Plan
          
          Based on your health data, here's a balanced 7-day exercise plan:
          
          ### General Guidelines:
          
          - Start slowly and gradually increase intensity
          - Listen to your body and rest when needed
          - Aim for at least 30 minutes of activity most days
          - Include a mix of cardio, strength, and flexibility exercises
          
          ### Weekly Schedule:
          
          **Monday: Cardio Focus**
          - 5-minute warm-up
          - 20-30 minutes of brisk walking, swimming, or cycling
          - 5-minute cool-down and stretching
          
          **Tuesday: Strength Training**
          - Bodyweight exercises: squats, modified push-ups, lunges
          - 2-3 sets of 10-12 repetitions each
          - Focus on proper form over quantity
          
          **Wednesday: Active Recovery**
          - Gentle yoga or stretching
          - Light walking
          
          **Thursday: Interval Training**
          - Alternate between 1 minute of higher intensity and 2 minutes of lower intensity
          - Total of 20 minutes plus warm-up and cool-down
          
          **Friday: Strength Training**
          - Different muscle groups than Tuesday
          - Include core-strengthening exercises
          
          **Saturday: Longer Cardio Session**
          - 40-45 minutes at a comfortable pace
          - Choose an activity you enjoy
          
          **Sunday: Rest and Flexibility**
          - Full rest or gentle stretching
          - Focus on deep breathing and relaxation
          
          ### Specific Recommendations:
          
          ${vitals.heart_rate && vitals.heart_rate > 90 ? '- Monitor your heart rate during exercise\n- Focus on moderate intensity activities\n' : ''}
          ${vitals.systolic_bp && vitals.systolic_bp > 120 ? '- Avoid exercises that involve holding your breath\n- Include more walking and swimming in your routine\n' : ''}
          ${symptoms && symptoms.toLowerCase().includes('joint pain') ? '- Choose low-impact exercises like swimming or cycling\n- Consider working with a physical therapist\n' : ''}
          
          Always consult with your healthcare provider before starting a new exercise program, especially if you have any health concerns.
        `
        break
        
      case 'sleep':
        response = `
          ## Personalized Sleep Plan
          
          Based on your health data, here's a 7-day plan to improve your sleep quality:
          
          ### General Guidelines:
          
          - Aim for 7-9 hours of sleep each night
          - Maintain a consistent sleep schedule (even on weekends)
          - Create a relaxing bedtime routine
          - Make your bedroom cool, dark, and quiet
          
          ### Daily Schedule:
          
          **Daytime Habits:**
          - Get exposure to natural light within 30 minutes of waking
          - Exercise regularly, but not within 2-3 hours of bedtime
          - Limit caffeine after noon and alcohol before bed
          - Take short power naps (20 minutes) before 3 PM if needed
          
          **Evening Routine:**
          - Dim lights 1-2 hours before bed
          - Avoid screens 30-60 minutes before sleep (or use blue light filters)
          - Try relaxation techniques like deep breathing or gentle stretching
          - Keep a consistent bedtime around 10-11 PM
          
          **Bedtime Ritual:**
          - Light reading (not on screens)
          - Gentle stretching or meditation
          - Write down tomorrow's tasks to clear your mind
          - Keep your bedroom temperature around 65-68°F (18-20°C)
          
          ### Specific Recommendations:
          
          ${vitals.heart_rate && vitals.heart_rate > 90 ? '- Practice deep breathing exercises before bed to help lower heart rate\n- Consider a warm bath 1-2 hours before bedtime\n' : ''}
          ${symptoms && symptoms.toLowerCase().includes('stress') ? '- Add 10 minutes of meditation to your bedtime routine\n- Try progressive muscle relaxation techniques\n' : ''}
          ${symptoms && symptoms.toLowerCase().includes('insomnia') ? '- Limit time in bed when not sleeping\n- If you can\'t fall asleep within 20 minutes, get up and do something relaxing until you feel sleepy\n' : ''}
          
          If sleep problems persist, consider consulting with a healthcare provider or sleep specialist for personalized advice.
        `
        break
        
      default:
        response = `
          ## Comprehensive Care Plan
          
          Based on your health data, here's a personalized 7-day wellness plan:
          
          ### Diet Recommendations:
          
          - Stay hydrated with 8-10 glasses of water daily
          - Focus on whole, unprocessed foods
          - Include a variety of colorful fruits and vegetables
          - Limit added sugars and sodium
          - Consider smaller, more frequent meals if you experience energy dips
          
          ### Exercise Suggestions:
          
          - Aim for at least 30 minutes of moderate activity most days
          - Include a mix of cardio, strength, and flexibility exercises
          - Start with walking, swimming, or cycling for cardio
          - Add 2-3 days of light strength training
          - Incorporate stretching or yoga for flexibility
          
          ### Sleep Optimization:
          
          - Maintain a consistent sleep schedule
          - Create a relaxing bedtime routine
          - Aim for 7-9 hours of quality sleep
          - Keep your bedroom cool, dark, and quiet
          - Limit screen time before bed
          
          ### Stress Management:
          
          - Practice deep breathing exercises daily
          - Consider meditation or mindfulness (even 5-10 minutes helps)
          - Take short breaks throughout the day
          - Spend time in nature when possible
          - Connect with supportive friends and family
          
          ### Specific Recommendations:
          
          ${vitals.systolic_bp && vitals.systolic_bp > 120 ? '- Monitor your blood pressure regularly\n- Reduce sodium intake and consider the DASH diet\n- Practice stress reduction techniques\n' : ''}
          ${vitals.heart_rate && vitals.heart_rate > 90 ? '- Check with your doctor about your elevated heart rate\n- Practice relaxation techniques\n- Monitor caffeine intake\n' : ''}
          ${symptoms ? `- For your reported symptoms (${symptoms}), consider keeping a symptom journal to identify patterns\n` : ''}
          
          Remember that this plan is a general guide. Always consult with healthcare professionals for personalized medical advice.
        `
    }
    
    return NextResponse.json({ plan: response })
  } catch (error) {
    console.error('Error processing care plan request:', error)
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    )
  }
}
    }
  }
}