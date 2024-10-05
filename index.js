const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { log } = require("console");

dotenv.config();
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Match your front-end URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const corsOptions = {
  origin: "http://localhost:5173", // Specify your front-end URL here
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};
// Middleware
app.use(cors(corsOptions));
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
    // io connection
    io.on("connection", (socket) => {
      console.log("New user connected");

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });

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
    app.post("/createpost", async (req, res) => {
      const post = req?.body;
      const resault = await postsCollectionDb.insertOne(post);
      io.emit("receivePost", post);
      res.status(201).send({ message: "content is posted." });
    });
    app.post("/updatepostdata", async (req, res) => {
      const { postId, updates } = req.body;
      try {
        // Log the postId and updates for clarity
        // console.log("Post ID for update:", postId);
        // console.log("Updates:", updates);
        // Perform the update
        const updatedPost = await postsCollectionDb.findOneAndUpdate(
          { _id: new ObjectId(postId) },
          { $set: updates },
          { returnDocument: "after" } // This ensures the updated document is returned
        );

        if (!updatedPost) {
          return res
            .status(404)
            .send({ message: "Post not found (during update)" });
        }
        // Log the updated post for debugging
        // console.log("Updated post:", updatedPost);
        // Send the updated post back to the client
        io.emit("postupdate", updatedPost);
        res.send(updatedPost);
      } catch (error) {
        // Handle errors and log them for debugging
        console.error("Error updating post:", error);
        res
          .status(500)
          .send({ message: "An error occurred while updating the post" });
      }
    });

    app.get("/posts", async (req, res) => {
      const skip = parseInt(req.query.skip, 10) || 0; // Get skip from query params and convert to integer
      try {
        const posts = await postsCollectionDb
          .find()
          .sort({ timestamp: -1 })
          .skip(skip * 10) // Skip 10 posts based on the count
          .limit(10) // Limit to 10 posts
          .toArray();

        res.status(200).send(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "An error occurred in getting data" });
      }
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
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
