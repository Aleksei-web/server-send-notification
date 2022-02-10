const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const sendPushNotification = require('./utils/expo');
require('dotenv').config();
require('./utils/connectdb');

const Token = require('./models/token');


const app = express();
app.use(bodyParser.json());

app.use(cors());
app.options('*', cors())

app.post('/send_notification', (req, res) => {
  const { title, body, data, to } = req.body;
  if (to === 'all') {
    Token.find({}, (err, allTokens) => {
      console.log('err', err, 'allTokens', allTokens);
      if (err) {
        res.statusCode = 500;
        res.send(err);
      }

      const tokens = allTokens.map((token) => {
        console.log('token.tokenValue', token.tokenValue);
        return { data: token.tokenValue };
      });

      sendPushNotification(tokens, title, body, data);
      res.send({ status: 'success' });
    });
  } else {
    sendPushNotification([{ data: to }], title, body, data);
    res.send({ status: 'success' });
  }
});

app.post('/save_user', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.send({
      status: 'error',
      error: 'Login and password is required.',
    });
  }

  const existUser = await Token.findOne({ login });
  console.log(existUser);

  if (existUser) {
    return res.status(400).send({
      error: 'User already exist',
    });
  }

  const newToken = new Token({
    tokenValue: null,
    password,
    login,
  });

  newToken.save((err, savedToken) => {
    if (err) {
      res.statusCode = 500;
      res.send(err);
    }

    res.send({ status: 'success', ...savedToken });
  });
});

app.post('/save_token', (req, res) => {
  const token = req.body.token;

  if (token) {
    Token.find({ tokenValue: token }, (err, existingToken) => {
      if (err) {
        res.statusCode = 500;
        res.send(err);
      }
      if (!err && existingToken.length === 0) {
        {
          const newToken = new Token({
            tokenValue: req.body.token,
            password: req.body.password,
            login: req.body.login,
          });

          newToken.save((err, savedToken) => {
            if (err) {
              res.statusCode = 500;
              res.send(err);
            }

            res.send({ status: 'success', token: savedToken });
          });
        }
      } else {
        res.send({ status: 'success' });
      }
    });
  } else {
    res.statusCode = 400;
    res.send({ message: 'token not passed!' });
  }
});

app.post('/login', async (req, res) => {
  const { login, password, token } = req.body;
  if (!login || !password) {
    return res.status(400).send({ error: 'Login and password is required' });
  }

  let user = await Token.findOne({ login });
  if (!user) {
    return res.status(404).send({ error: 'User not found' });
  }

  if (user.password !== password) {
    return res.status(400).send({ error: 'Password has missing' });
  }

  if (token && user.tokenValue !== token) {
    user = await Token.updateOne({ login }, { tokenValue: token });
  }

  return res.status(200).send({ user: { login, tokenValue: user.tokenValue } });
});

app.get('/all_tokens', (req, res) => {
  Token.find({ tokenValue: { $ne: null }}, (err, allTokens) => {
    if (err) {
      res.statusCode = 500;
      res.send(err);
    }
    console.log(allTokens);
    res.send(
      allTokens.map((token) => ({
        value: token.tokenValue,
        login: token.login,
        password: token.password,
        _id: token._id,
      }))
    );
  });
});

const server = app.listen(process.env.PORT || 8081, () => {
  const port = server.address().port;
  console.log('App started at port:', port);
});
