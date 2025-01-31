require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ljf3d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    const database = client.db("movieDB");
    const movieCollection = database.collection("movie");

    const favoriteCollection = client.db("movieDB").collection("favorites");

    //  all movies

    app.get("/allMovie", async (req, res) => {
      const { searchParams, sort } = req.query;

      let option = {};
      let sortOption = {};

      if (searchParams) {
        option = {
          name: {
            $regex: searchParams,
            $options: "i",
          },
        };
      }

      if (sort) {
        sortOption = { rating: sort === "asc" ? 1 : -1 };
      }
    

      const cursor = movieCollection.find(option).sort(sortOption);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/movie", async (req, res) => {
      const cursor = movieCollection.find().sort({ rating: -1 }).limit(8);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get my added movies
    app.get("/myAddedMovies/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await movieCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/movie/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.findOne(query);
      res.send(result);
    });

    app.post("/movie", async (req, res) => {
      const newMovie = req.body;
      const result = await movieCollection.insertOne(newMovie);
      res.send(result);
    });

    // update
    app.put(`/movie/:id`, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = req.body;
      const doc = {
        $set: {
          photo: updatedDoc.photo,
          name: updatedDoc.name,
          genre: updatedDoc.genre,
          duration: updatedDoc.duration,
          releaseYear: updatedDoc.releaseYear,
          rating: updatedDoc.rating,
          summary: updatedDoc.summary,
        },
      };

      const result = await movieCollection.updateOne(filter, doc, options);

      res.send(result);
    });

    app.delete("/movie/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.deleteOne(query);
      res.send(result);
    });

    // add favorite list

    app.get("/favorites/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await favoriteCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/favorites/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await favoriteCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/favorites", async (req, res) => {
      const { email, movieId } = req.body;
      const existingFavorite = await favoriteCollection.findOne({
        email,
        movieId,
      });

      if (existingFavorite) {
        console.log("Movie is already in favorites for user");
        return;
      }

      const newFavorite = req.body;
      const result = await favoriteCollection.insertOne(newFavorite);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    // test code
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("api is running");
});

app.listen(port, () => {
  console.log(`api running on port ${port}`);
});
