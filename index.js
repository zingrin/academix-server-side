console.clear();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB URI from .env
const uri = `mongodb+srv://jeinhoby:X9coMafLNQe5mXb9@cluster0.tkd5xye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const courseCollection = client.db("Academix").collection("course");
    const enrollmentCollection = client
      .db("Academix")
      .collection("enrollments");

    // GET all courses or filter by instructor email
    app.get("/courses", async (req, res) => {
      const email = req.query.email;
      const query = { instructor_email: email };
      const result = await courseCollection.find(query).toArray();
      res.send(result);
    });

    // GET single course by ID
    app.get("/courseDetails/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query ={ _id:id }
        const course = await courseCollection.findOne(query);
          
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        res.send(course);
      } catch (error) {
        console.error("Error fetching course by ID:", error);
        res.status(500).json({ message: "Server Error" });
      }
    });


    // GET limited courses (top 6)
    app.get("/api/courses", async (req, res) => {
      try {
        const result = await courseCollection.find().limit(6).toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
      }
    });
    app.get("/courses", async (req, res) => {
      try {
        const result = await courseCollection.find().toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
      }
    });

    // GET enrollments for a student
    app.get("/enrollments", async (req, res) => {
      const email = req.query.email;
      const query = { student_email: email };
      const enrollments = await enrollmentCollection.find(query).toArray();

      // Add course info to each enrollment
      for (const enrollment of enrollments) {
        const course = await courseCollection.findOne({
          _id: new ObjectId(enrollment.courseId),
        });
        enrollment.title = course?.title;
        enrollment.instructor = course?.instructor;
        enrollment.image = course?.image;
      }

      res.send(enrollments);
    });

    // POST new enrollment
    app.post("/enroll", async (req, res) => {
      const enrollment = req.body;
      const result = await enrollmentCollection.insertOne(enrollment);
      res.send(result);
    });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("📘 Course API Server Running!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
