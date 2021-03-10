const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const tokenList = {};
const router = express.Router();

router.get('/', (request, response) => {
  response.send('Hello world');
});

router.get('/status', (request, response) => {
  response.status(200).json({ message: 'ok', status: 200 });
});

router.post('/signup', passport.authenticate('signup', { session: false }), async (request, response, next) => {
  response.status(200).json({ message: 'signup successful', status: 200 });
});

router.post('/login', async (request, response, next) => {
  passport.authenticate('login', async (error, user) => {
    try {
      if (error) {
        return next(error);
      }
      if (!user) {
        return next(new Error('email and password are required'));
      }

      request.login(user, { session: false }, (err) => {
        if (err) return next(err);

        // create our jwt
        const body = {   // creates body of request for generating JWT
          _id: user._id,
          email: user.email,
          name: user.username,
        };
          // the secret is not shared with anyone else
        const token = jwt.sign({ user: body }, process.env.JWT_SECRET, { expiresIn: 300 }); // needs to have a shorter lifespan than refresh token
        const refreshToken = jwt.sign({ user: body }, process.env.JWT_REFRESH_SECRET, { expiresIn: 86400 });

        // store tokens in cookie
        response.cookie('jwt', token);
        response.cookie('refreshJwt', refreshToken);

        // store tokens in memory
         // this is used for storing the refresh token. normally stored in a database, but simplified in memory for this tutorial
        tokenList[refreshToken] = {
          token,
          refreshToken,
          email: user.email,
          _id: user._id,
          name: user.name,
        };

        // send the token to the user
        return response.status(200).json({ token, refreshToken, status: 200 });
      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  })(request, response, next);
});

router.post('/logout', (request, response) => {
  if (request.cookies) {
    const refreshToken = request.cookies.refreshJwt;
    if (refreshToken in tokenList) delete tokenList[refreshToken];
    response.clearCookie('jwt');
    response.clearCookie('refreshJwt');
  }
  response.status(200).json({ message: 'logged out', status: 200 });
});

router.post('/token', (request, response) => {
  const { refreshToken } = request.body;
  if (refreshToken in tokenList) {
    const body = {
      email: tokenList[refreshToken].email,
      _id: tokenList[refreshToken]._id,
      name: tokenList[refreshToken].name,
    };
    const token = jwt.sign({ user: body }, process.env.JWT_SECRET, { expiresIn: 300 });

    // update jwt
    response.cookie('jwt', token);
    tokenList[refreshToken].token = token;

    response.status(200).json({ token, status: 200 });
  } else {
    response.status(401).json({ message: 'unauthorized', status: 401 });
  }
});

module.exports = router;
