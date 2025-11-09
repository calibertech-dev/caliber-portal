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

app.get('/whoami', async (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.json({ user: null });
  // Connect to Salesforce using jsforce with integration user
  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL,
  });
  await conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);
  // Query Contact by Auth0 User Id
  const contact = await conn.sobject('Contact').findOne({
    Auth0_User_Id__c: req.oidc.user.sub
  });
  res.json({ contact });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Caliber Portal running');
});
