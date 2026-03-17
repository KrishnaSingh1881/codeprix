require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./src/models/Question');
const { questions } = require('./src/data.js'); // The existing dummy data

const seedDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Wipe existing questions
    await Question.deleteMany();
    
    // Insert initial data from data.js
    const result = await Question.insertMany(questions.map(q => ({
      title: q.title,
      category: q.category,
      description: q.description,
      difficulty: q.difficulty
    })));

    console.log(`${result.length} questions seeded successfully!`);
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    process.exit(0);
  }
};

seedDb();
