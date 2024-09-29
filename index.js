import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cazjtjr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Route to handle user creation
app.post("/users", async (req, res) => {
  try {
    const database = client.db("Instashohor");
    const userCollectionDb = database.collection("Users");

    const user = req.body;
    const query = { email: user.email };
    console.log(user);

    // Await the findOne operation
    const existingUser = await userCollectionDb.findOne(query);

    if (existingUser) {
      return res.status(400).send({ message: "User already exists!" });
    }

    // Insert the new user if not existing
    const result = await userCollectionDb.insertOne(user);
    res.status(201).send({ message: "User created successfully", result });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Hello, welcome to the server!");
});

// Start the server
app.listen(PORT, async () => {
  await connectDB(); // Ensure the database is connected before handling requests
  console.log(`Server is running on port: ${PORT}`);
});
