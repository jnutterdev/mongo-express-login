const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unqiue: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExp: {
    type: Date,
  },
});

// this hook 'pre' hashes user password with bcrypt before saving to database
UserSchema.pre('save', async function(next) {
  const hash = await bcrypt.hash(this.password, 10); // 10 sets the number of rounds of salting the password hash
  this.password = hash;
  next();
});

// this method 'isValidPassword' validates user password using bcrypt's compare method, returns either true or false
UserSchema.methods.isValidPassword = async function (password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
};

const UserModel = mongoose.model('user', UserSchema);

module.exports = UserModel;
