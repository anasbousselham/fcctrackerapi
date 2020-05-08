const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid= require('shortid')
const User = require("./model");


const cors = require('cors')

const mongoose = require('mongoose')
const Model = mongoose.model;

mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' ).then(()=>{
  console.log('Db connected')
},err=>{
  console.log('Err ')
})

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//******/
app.get("/api/exercise/users", function(req, res) {
  User.find({}, function(err, allUser) {
    if (err) return console.log(err);
    res.json(
      allUser.map(user => ({
        _id: user._id,
        username: user.username,
        __v: user.__v
      }))
    );
  });
});

app.post("/api/exercise/new-user", function(req, res) {
  let username = req.body.username;

  if (username === "") {
    res.send("Path `username` is required");
  } else if (username.length > 29) {
    return res.send("username too long");
  } else {
    const newUser = { username: username };
    User.findOne({ username: newUser.username }, (err, data) => {
      if (err) res.json({err:err});
      if (data) {
        return res.send("username is already taken");
      } else {
        User.create(newUser, (err, newUser) => {
          if (err) res.json({err:err});
          res.json({username: newUser.username,_id: newUser._id });//res.json({name:req.body.username,id:docs._id});
        });
      }
    });
  }
});

function newData(data, arr) {
  return (
    (data.count = arr.length),
    (data.log = arr.map(log => ({
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString()
    })))
  );
}///api/exercise/log/:userId

app.get("/api/exercise/log", (req, res)=> {
 
  //req.query.username;
  let userId = req.query.userId,
    from = new Date(req.query.from),
    to = new Date(req.query.to),
    limit = +req.query.limit;

  User.findById(userId, (err, user)=> {
    if (err) console.log(err);
    if (user) {
      let log = user.log;
      let newLog = [];
      let data = {
        _id: user._id,
        username: user.username
      };

      if (!isNaN(from.valueOf()) && !isNaN(to.valueOf()) && !isNaN(limit)) {
        newLog = log.filter(log => log.date >= from && log.date <= to);
        data.from = from.toDateString();
        data.to = to.toDateString();
        let arrLog = [];
        if (limit > 0 && limit <= newLog.length) {
          for (let i = 0; i < limit; i++) {
            arrLog.push(newLog[i]);
          }
          newLog = arrLog;
        }
        newData(data, newLog);
      } else if (!isNaN(from.valueOf()) && !isNaN(to.valueOf())) {
        newLog = log.filter(log => log.date >= from && log.date <= to);
        data.from = from.toDateString();
        data.to = to.toDateString();
        newData(data, newLog);
      } else if (!isNaN(limit) && limit > 0 && limit <= log.length) {
        for (let i = 0; i < limit; i++) {
          newLog.push(log[i]);
        }
        newData(data, newLog);
      } else {
        newData(data, log);
      }

      res.json(data);
    } else {
      return res.send("unknown userId");
    }
  });
});

/*
User.findByIdAndUpdate(
    input.userId,
    { $push: { exercise: exerciseInstance } },
    (err, doc) => {
      if (err) return console.log("Error: ", err);
      res.json({
        username: doc.username,
        exercise: exerciseInstance,  
        _id: doc._id,
      });
    }
  );

*/


app.post("/api/exercise/add", function(req, res) {
  let { userId, description, duration, date } = req.body;
  let log = { description, duration, date };

  if (userId) {
    User.findById(userId, function(err, user) {
      if (err) res.json({err:err});
      if (user) {
        user.log.push(log);
        user.save(function(err, user) {
          if (err) res.json({err:err})
          let newLog = user.log.length - 1;
          res.json({
            username: user.username,
            description: user.log[newLog].description,
            duration: user.log[newLog].duration,
            _id: userId,
            date: user.log[newLog].date.toDateString()
          });
        });
      } else {
        return res.send("userId " + req.body.userId + " not found");
      }
    });
    
  } else if (userId === "") {
    return res.send("unknown _id");
  } else if (duration === "") {
    return res.send("Path `duration` is required.");
  } else if (description === "") {
   return res.send("Path `description` is required.");
  } else if (description > 20) {
    return res.send("description too long");
  } else {
    return res.send("error");
  }
}); 


//
// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})