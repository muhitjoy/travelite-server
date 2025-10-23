const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middlewire
app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("tour-package");
    const tourCollections = database.collection("travels");
    const bookingCollection = database.collection("bookings");

    app.get("/tours", async (req, res) => {
      const allTours = await tourCollections.find().toArray();
      // console.log(allTours);
      res.send(allTours);
    });

    app.get("/featured-tours", async (req, res) => {
      const sixData = req.body;
      const result = await tourCollections.find(sixData).limit(6).toArray();
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const result = await bookingCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });

    // get a single package by email
    app.get("/my-packages/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { guide_email: email };
      const packages = await tourCollections.find(filter).toArray();
      console.log(packages);
      res.send(packages);
    });

    // update tourdata related
    app.get("/tours/:id", async (req, res) => {
      const id = req.params.id;
      const tour = await tourCollections.findOne({ _id: new ObjectId(id) });
      res.send(tour);
    });

    // save a tour data in database through post request
    app.post("/add-tour", async (req, res) => {
      const tourData = req.body;
      const result = await tourCollections.insertOne(tourData);
      // console.log(result);
      res.status(201).send({ ...result, message: "Data paisi vai thanks" });
    });

    // handle bookings
    app.post("/place-booking/:packageId", async (req, res) => {
      const bookingData = req.body.bookingData;
      const result = await bookingCollection.insertOne(bookingData);
      // console.log(result);
      res.status(201).send(result);
    });

    // update tour data
    app.put("/tours/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateTour = req.body;
      const updatedDoc = {
        $set: updateTour,
      };
      const result = await tourCollections.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    

    // handle like toggle
    app.patch("/like/:packageId", async (req, res) => {
      const id = req.params.packageId;
      const email = req.body.email;
      const filter = { _id: new ObjectId(id) };
      const tour = await tourCollections.findOne(filter);
      // check if the user has already liked the the tour or not
      const alreadyLiked = tour.likedBy.includes(email);
      console.log(
        "ekdom shurute like er obostha---> alreadyLiked: ",
        alreadyLiked
      );

      const updateDoc = alreadyLiked
        ? {
            $pull: {
              // dislike tour ( pop email from likedBy array)
              likedBy: email,
            },
          }
        : {
            $addToSet: {
              // Like tour (push email in like by array)
              likedBy: email,
            },
          };

      await tourCollections.updateOne(filter, updateDoc);

      console.log(
        "ekdom sheshe like er obostha---> alreadyLiked: ",
        !alreadyLiked
      );

      res.send({
        message: alreadyLiked ? "Dislike Successful" : "Like Successful",
        liked: !alreadyLiked,
      });
    });

    // confirm booking
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status: "completed" } };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    // Package Delete Api
    app.delete('/tours/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await tourCollections.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Tour Package Booking Server is Running");
});

app.listen(port, () => {
  console.log(`Tour Package Booking Server is Running on port ${port}`);
});
