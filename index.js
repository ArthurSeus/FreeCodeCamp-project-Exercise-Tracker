const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String
});

const User = mongoose.model('User', userSchema);

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


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
