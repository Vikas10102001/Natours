const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Exception");
  process.exit(1);
});

let con = process.env.DB_CONNECTION;
con = con.replace("<PASSWORD>", process.env.DB_PASSWORD);

try {
  mongoose
    .connect(con, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log("DB connection successfull");
    });
} catch (er) {
  console.log(er);
}
const server = app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT} `);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Rejection");
  server.close(() => {
    //gives time to server for handling the pending request
    process.exit(1);
  });
});
