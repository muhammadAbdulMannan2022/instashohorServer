const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cazjtjr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db("Instashohor");
    const userCollectionDb = database.collection("Users");
    const postsCollectionDb = database.collection("posts");

    // Route to handle user creation
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };

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
    app.post("/posts", async (req, res) => {
      const post = req?.body;
      const resault = await postsCollectionDb.insertOne(post);
      res.status(201).send({ message: "content is posted." });
    });

    // Default route
    app.get("/", (req, res) => {
      res.send("Hello, welcome to the server!");
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.dir);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
