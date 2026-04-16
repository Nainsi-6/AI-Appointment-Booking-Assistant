import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { connectDB, saveAppointment, getAppointments, deleteAppointment } from './db.js';
import { extractAppointmentDetails, generateConfirmationMessage } from './groq.js';

dotenv.config();

function formatDate(dateStr) {
  if (!dateStr) return dateStr;

  const today = new Date();

  // tomorrow
  if (dateStr.toLowerCase() === "tomorrow") {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    return d.toDateString();
  }

  // today
  if (dateStr.toLowerCase() === "today") {
    return today.toDateString();
  }

  // next Monday, Tuesday etc.
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const lower = dateStr.toLowerCase();

  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let diff = targetDay - currentDay;

      if (diff <= 0) diff += 7;

      const d = new Date(today);
      d.setDate(today.getDate() + diff);
      return d.toDateString();
    }
  }

  return dateStr; // fallback
}

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database on server start
await connectDB(process.env.MONGODB_URI);

const userSessions = {};

// ✅ Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// ✅ Chat Endpoint - Main booking functionality
app.post('/api/chat', async (req, res) => {
  console.log("🔥 CHAT HIT");

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const casualMessages = ["hi", "hello", "hey", "hellooo", "hii"];

if (casualMessages.includes(message.toLowerCase().trim())) {
  return res.json({
    success: true,
    message: "Hey 😊 I can help you book an appointment. Just tell me date and time whenever you're ready!",
    extractedData: null
  });
}

    const userId = "default-user"; // single user for now

    // Initialize session
    if (!userSessions[userId]) {
      userSessions[userId] = {};
    }

    // 🔹 Extract appointment details using Groq
    const extractionResult = await extractAppointmentDetails(message);

    if (!extractionResult.success) {
      return res.status(500).json({
        error: 'Failed to process appointment',
        details: extractionResult.error
      });
    }

    const { data, tokensUsed } = extractionResult;

    console.log("🧠 Extracted:", data);

    // 🧠 Merge previous + current data
    const previousData = userSessions[userId];

    const mergedData = {
      intent: data.intent || previousData.intent,
      date: data.date || previousData.date,
      time: data.time || previousData.time,
      name: data.name || previousData.name,
      duration_minutes: data.duration_minutes || previousData.duration_minutes
    };

    // Save merged session
    userSessions[userId] = mergedData;

    console.log("🧠 Merged:", mergedData);

    // ❌ If intent not clear (AFTER merge)
    if (!mergedData.intent) {
      return res.json({
       success: true,
    message: "I'm here to help 😊 You can say things like 'Book a meeting tomorrow at 3pm'.",
    extractedData: mergedData
      });
    }

    // ❌ Missing date/time
    if (mergedData.intent === 'book' && (!mergedData.date || !mergedData.time)) {
      return res.json({
        success: true,
        message: "Could you please tell me the date and time for the appointment?",
        extractedData: mergedData
      });
    }

    // ❌ Missing name
   if (mergedData.intent === 'book' && (!mergedData.name || mergedData.name.trim() === "")) {
      return res.json({
        success: true,
        message: "Got it 👍 What name should I book this appointment under?",
        extractedData: mergedData
      });
    }

    // ✅ Save only when complete
    let savedAppointment = null;

    if (mergedData.intent === 'book' && mergedData.date && mergedData.time && mergedData.name) {
      savedAppointment = await saveAppointment({
        date: mergedData.date,
        time: mergedData.time,
        name: mergedData.name,
        duration_minutes: mergedData.duration_minutes || 30,
        userMessage: message
      });

      // 🧹 CLEAR session after success
      userSessions[userId] = {};
    }

    // ✅ Generate confirmation
    const finalData = {
  ...mergedData,
  date: formatDate(mergedData.date)
};

const confirmationMessage = await generateConfirmationMessage(finalData);

    return res.json({
      success: true,
      message: confirmationMessage,
      extractedData: finalData,
      appointmentId: savedAppointment?._id || null,
      tokensUsed
    });

  } catch (error) {
    console.error('❌ Chat endpoint error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ✅ Get All Appointments (Admin)
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await getAppointments();
    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ✅ Delete Appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteAppointment(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    console.error('❌ Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   🚀 Appointment Booking Server is running!              ║
║   📍 http://localhost:${PORT}                              ║
║   🔗 CORS enabled for: ${CLIENT_URL}                       ║
║   📊 Database: MongoDB Atlas                             ║
║   🤖 AI: Groq (llama3-8b-8192)                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
