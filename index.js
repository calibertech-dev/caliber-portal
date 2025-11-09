require('dotenv').config();
const express = require('express');
const { auth } = require('express-openid-connect');
const jsforce = require('jsforce');

const app = express();

app.use(auth({
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SESSION_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_DOMAIN,
}));

app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/whoami', async (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.json({ user: null });
  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL,
  });
  await conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);
  const contact = await conn.sobject('Contact').findOne({
    Auth0_User_Id__c: req.oidc.user.sub
  });
  res.json({ contact });
});

app.get('/', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.send(`
      <h1>Welcome to Caliber Portal</h1>
      <p>You are logged in as: ${req.oidc.user.email}</p>
      <p><a href="/whoami">View My Salesforce Contact Info</a></p>
      <p><a href="/logout">Logout</a></p>
    `);
  } else {
    res.send(`
      <h1>Welcome to Caliber Portal</h1>
      <p>You are not logged in.</p>
      <p><a href="/login">Login with Auth0</a></p>
    `);
  }
});


app.listen(process.env.PORT || 3000, () => {
  console.log('Caliber Portal running');
});
