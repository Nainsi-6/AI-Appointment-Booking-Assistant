// import { Groq } from 'groq-sdk';
// import dotenv from "dotenv";
// dotenv.config();

// const client = new Groq({
//   apiKey: process.env.GROQ_API_KEY
// });

// const SYSTEM_PROMPT = `You are an AI assistant that extracts appointment booking details from user input.

// IMPORTANT: You MUST return ONLY valid JSON, nothing else. No explanations, no extra text.

// Extract structured JSON from natural language user input.

// Rules:
// - Always return valid JSON
// - Do not include any extra text
// - If info is missing, use null
// - For dates: convert "tomorrow", "next Monday" to actual dates or keep relative dates
// - For times: normalize to HH:MM format (24-hour) if possible, otherwise keep as provided
// - For names: extract person names when mentioned

// Format:
// {
//   "intent": "book",
//   "date": "",
//   "time": "",
//   "name": null,
//   "duration_minutes": null
// }

// Examples:

// Input: "Book meeting tomorrow at 5pm"
// Output:
// {
//   "intent": "book",
//   "date": "tomorrow",
//   "time": "17:00",
//   "name": null,
//   "duration_minutes": null
// }

// Input: "Schedule call on Monday at 3pm for John Smith"
// Output:
// {
//   "intent": "book",
//   "date": "Monday",
//   "time": "15:00",
//   "name": "John Smith",
//   "duration_minutes": null
// }

// Input: "I want to book an appointment next Friday at 10:30 AM with duration of 1 hour"
// Output:
// {
//   "intent": "book",
//   "date": "next Friday",
//   "time": "10:30",
//   "name": null,
//   "duration_minutes": 60
// }

// Now process the user input:`;

// export async function extractAppointmentDetails(userMessage) {
//   try {
//     const message = await client.messages.create({
//       model: 'llama3-8b-8192',
//       max_tokens: 500,
//       system: SYSTEM_PROMPT,
//       messages: [
//         {
//           role: 'user',
//           content: userMessage
//         }
//       ]
//     });

//     const responseText = message.content[0].type === 'text' 
//       ? message.content[0].text 
//       : '';
    
//     // Parse JSON from response
//     const jsonMatch = responseText.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) {
//       throw new Error('No JSON found in response');
//     }
    
//     const extractedData = JSON.parse(jsonMatch[0]);
//     return {
//       success: true,
//       data: extractedData,
//       tokensUsed: {
//         input: message.usage?.input_tokens || 0,
//         output: message.usage?.output_tokens || 0
//       }
//     };
//   } catch (error) {
//     console.error('❌ Groq API Error:', error.message);
//     return {
//       success: false,
//       error: error.message,
//       data: null
//     };
//   }
// }

// export async function generateConfirmationMessage(appointmentData) {
//   try {
//     const message = await client.messages.create({
//       model: 'llama3-8b-8192',
//       max_tokens: 200,
//       messages: [
//         {
//           role: 'user',
//           content: `Generate a friendly confirmation message for an appointment booking:
//           - Date: ${appointmentData.date}
//           - Time: ${appointmentData.time}
//           - Name: ${appointmentData.name || 'Guest'}
//           - Keep it short and professional (2-3 sentences max)`
//         }
//       ]
//     });

//     return message.content[0].type === 'text' ? message.content[0].text : '';
//   } catch (error) {
//     console.error('❌ Error generating confirmation:', error.message);
//     return 'Your appointment has been confirmed!';
//   }
// }

import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are an AI assistant that extracts appointment booking details from user input.

IMPORTANT: You MUST return ONLY valid JSON, nothing else. No explanations, no extra text.

Extract structured JSON from natural language user input.

Rules:
- Always return valid JSON
- Do not include any extra text
- If info is missing, use null
- For dates: convert "tomorrow", "next Monday" to actual dates or keep relative dates
- For times: normalize to HH:MM format (24-hour) if possible, otherwise keep as provided
- For names: extract person names when mentioned

Format:
{
  "intent": "book",
  "date": "",
  "time": "",
  "name": null,
  "duration_minutes": null
}

Examples:

Input: "Book meeting tomorrow at 5pm"
Output:
{
  "intent": "book",
  "date": "tomorrow",
  "time": "17:00",
  "name": null,
  "duration_minutes": null
}

Input: "Schedule call on Monday at 3pm for John Smith"
Output:
{
  "intent": "book",
  "date": "Monday",
  "time": "15:00",
  "name": "John Smith",
  "duration_minutes": null
}

Input: "I want to book an appointment next Friday at 10:30 AM with duration of 1 hour"
Output:
{
  "intent": "book",
  "date": "next Friday",
  "time": "10:30",
  "name": null,
  "duration_minutes": 60
}

Now process the user input:`;

export async function extractAppointmentDetails(userMessage) {
  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 500,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const responseText = completion.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: extractedData,
      tokensUsed: {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0
      }
    };

  } catch (error) {
    console.error('❌ Groq API Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

export async function generateConfirmationMessage(appointmentData) {
  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Write a natural, friendly confirmation message.

Rules:
- Do NOT include quotes
- Use AM/PM format (convert 15:00 → 3 PM)
- Keep it human-like and short
- Do NOT include any intro like "Here's a message"
- Do NOT use quotes
- Keep it simple and human-like
- ALWAYS use the exact date provided (DO NOT say "tomorrow")

Example:
"Hi Isha, your meeting is scheduled for Fri Apr 17 2026 at 3 PM."

Details:
Date: ${appointmentData.date}
Time: ${appointmentData.time}
Name: ${appointmentData.name || 'you'}`
        }
      ]
    });

    return completion.choices?.[0]?.message?.content || '';

  } catch (error) {
    console.error('❌ Error generating confirmation:', error);
    return 'Your appointment has been confirmed!';
  }
}
