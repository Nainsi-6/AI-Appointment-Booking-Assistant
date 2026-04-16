import { MongoClient, ObjectId } from 'mongodb';
import dotenv from "dotenv";
dotenv.config();

let db = null;
let appointmentsCollection = null;

export async function connectDB(mongoUri) {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('appointment_booking');
    appointmentsCollection = db.collection('appointments');
    
    // Create index for efficient queries
    await appointmentsCollection.createIndex({ createdAt: -1 });
    
    console.log('✅ Connected to MongoDB');
    return { db, appointmentsCollection };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

export async function saveAppointment(appointmentData) {
  if (!appointmentsCollection) throw new Error('Database not connected');
  
  const appointment = {
    ...appointmentData,
    createdAt: new Date(),
    status: 'confirmed'
  };
  
  const result = await appointmentsCollection.insertOne(appointment);
  return { ...appointment, _id: result.insertedId };
}

export async function getAppointments() {
  if (!appointmentsCollection) throw new Error('Database not connected');
  return await appointmentsCollection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function deleteAppointment(id) {
  if (!appointmentsCollection) throw new Error('Database not connected');
  const result = await appointmentsCollection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
