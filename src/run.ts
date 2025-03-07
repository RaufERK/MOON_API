import * as mongoose from 'mongoose'
import 'dotenv/config'

async function connectDB() {
  await mongoose.connect('mongodb://localhost:27017/mydatabase')
  console.log('✅ MongoDB connected!')
}

connectDB()
