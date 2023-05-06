const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);


var exercisesSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, min: 1, required: true },
	date: { type: String, required: true }
});

const Exercises = mongoose.model('Exercices', exercisesSchema);

app.use('/', bodyParser.urlencoded({ extended: false }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', (req, res) => {
  const username = req.body.username;

  const newUser = new User({
    username: username
  })

  newUser.save((err, saved) => {
    if(err){
      console.error(err)
    } else {
      console.log(`saved: ${saved}`)
      User.findOne({ username: username }, (err, user) => {
        if(err){
          console.error(err)
        } else {
          console.log(user)
          res.json({ "username": user['username'], "_id": user['_id']})
        }
      })
    }
  })
})

app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(users);
    res.json(users);
  });
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();

  if(!description) res.json({ error: 'Need to inform description'})
  if(!duration) res.json({ error: 'Need to inform duration and it needs to be a number'})

  User.findOne({ _id: id }, (err, foundUser) => {
    if(err){
      console.error(err)
    } else {
      if(foundUser){
        const newExercice = new Exercises({
          userId: id,
          description,
          duration,
          date: date.toISOString()
        })

        newExercice.save((err, saved) => {
          if(err){
            console.error(err)
          } else {
            console.log(`saved: ${saved}`)
            res.json({
              "_id": id,
              "username": foundUser.username,
              "date": date.toDateString(),
              "duration": duration,
              "description": description 
            })
          }
        })
      } else {
        console.log('invalid id')
        res.json({ error: 'invalid id informed' })
      }
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id
  let findCondition = { userId: id }
  User.findOne({ _id: id }, (err, foundUser) => {
    if(err) {
      console.error(err)
    } else {

      if (
        (req.query.from !== undefined && req.query.from !== '')
        ||
        (req.query.to !== undefined && req.query.to !== '')
      ) {
        findCondition.date = {};
    
        if (req.query.from !== undefined && req.query.from !== '') {
          findCondition.date.$gte = new Date(req.query.from).toISOString();
        }
    
        if (findCondition.date.$gte == 'Invalid Date') {
          return res.json({ error: 'from date is invalid' });
        }
    
        if (req.query.to !== undefined && req.query.to !== '') {
          findCondition.date.$lte = new Date(req.query.to).toISOString();
        }
    
        if (findCondition.date.$lte == 'Invalid Date') {
          return res.json({ error: 'to date is invalid' });
        }
      }
    
      let limit = (req.query.limit !== undefined ? parseInt(req.query.limit) : 0);
    
      if (isNaN(limit)) {
        return res.json({ error: 'limit is not a number' });
      }

      console.log(findCondition)

      Exercises.find(findCondition)
      .sort({ date: 'asc' })
      .select('-_id description duration date')
      .limit(limit)
      .exec((err, foundExercices) => {
        if(err) {
          console.error(err)
        } else {
          console.log(foundExercices);
          const count = foundExercices.length
          res.json({
            "_id": foundUser._id,
            "username": foundUser.username,
            "count": count,
            "log": foundExercices.map((exer) => {
              return {
                description: exer.description,
                duration: exer.duration,
                date: new Date(exer.date).toDateString()
              }
            })
          })
        }
      }) 
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
