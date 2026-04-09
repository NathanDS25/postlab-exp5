require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/postlab-exp5';

async function runTests() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for index testing.");

    // Clear previous data
    await User.deleteMany({});
    
    // Insert Sample Data
    const sampleUsers = [
        { name: "Alice Smith", email: "alice@gmail.com", age: 25, hobbies: ["reading", "hiking"], bio: "A software developer who loves the outdoors.", userId: "u101" },
        { name: "Bob Jones", email: "bob@gmail.com", age: 30, hobbies: ["gaming"], bio: "Gamer and tech enthusiast.", userId: "u102" },
        { name: "Charlie Brown", email: "charlie@gmail.com", age: 25, hobbies: ["hiking", "photography"], bio: "Photographer capturing the beauty of nature.", userId: "u103" },
        { name: "Diana Prince", email: "diana@gmail.com", age: 28, hobbies: ["reading", "sports"], bio: "Always active, always reading.", userId: "u104" }
    ];
    await User.insertMany(sampleUsers);
    console.log("Sample data inserted.");

    // Helper to print stats
    const printStats = (testName, stats) => {
        console.log(`\n--- ${testName} ---`);
        const es = stats.executionStats;
        console.log(`  Winning Plan: ${stats.queryPlanner.winningPlan.stage}`);
        if(stats.queryPlanner.winningPlan.inputStage) {
            console.log(`  Index Examined: ${stats.queryPlanner.winningPlan.inputStage.indexName}`);
        }
        console.log(`  Keys Examined: ${es.totalKeysExamined}`);
        console.log(`  Docs Examined: ${es.totalDocsExamined}`);
        console.log(`  Execution Time: ${es.executionTimeMillis}ms`);
    };

    // Test 1: Single Field Index on name
    const stats1 = await User.find({ name: "Alice Smith" }).explain("executionStats");
    printStats("Single Field Index Test (name='Alice Smith')", stats1);

    // Test 2: Compound Index on email and age
    const stats2 = await User.find({ email: "alice@gmail.com", age: 25 }).explain("executionStats");
    printStats("Compound Index Test (email and age)", stats2);

    // Test 3: Multikey Index on hobbies
    const stats3 = await User.find({ hobbies: "hiking" }).explain("executionStats");
    printStats("Multikey Index Test (hobbies contains 'hiking')", stats3);

    // Test 4: Text index on bio
    const stats4 = await User.find({ $text: { $search: "developer outdoors" } }).explain("executionStats");
    printStats("Text Index Test (bio contains 'developer outdoors')", stats4);

    // Test 5: Hashed index on userId
    const stats5 = await User.find({ userId: "u104" }).explain("executionStats");
    printStats("Hashed Index Test (userId='u104')", stats5);
    
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

runTests();
