const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Token = new Schema({
  tokenValue: {
    type: String,
    default: '',
  },
  login: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: 'string',
    required: true,
  },
});

module.exports = mongoose.model('Token', Token);
