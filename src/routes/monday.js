const mondaySdk = require('monday-sdk-js');
const jwt = require('jsonwebtoken');
const monday = mondaySdk();
const router = require('express').Router();
const { authenticationMiddleware } = require('../middlewares/authentication');
const mondayController = require('../controllers/monday-controller');
const { SecureStorage } = require('@mondaycom/apps-sdk');
 
const secureStorage = new SecureStorage(process.env.MONDAY_API_TOKEN);

router.post('/monday/copy_move_file_column', authenticationMiddleware, mondayController.copyFileFromColumnToColumn);
router.post('/monday/copy_move_file_item', authenticationMiddleware, mondayController.copyFileFromItemToItem);
router.post('/monday/copy_move_file_board', authenticationMiddleware, mondayController.copyFileFromBoardToBoard);
router.post('/monday/get_file_columns', authenticationMiddleware, mondayController.getFileColumnsFromBoard);
router.post('/monday/get_options', authenticationMiddleware, mondayController.handleGetRemoteListOptions);


// router.get('/auth', (req, res) => {
//   const { backToUrl, userId, accountId } = req.query;

//   const state = jwt.sign(
//     { backToUrl, userId, accountId },
//     process.env.MONDAY_SIGNING_SECRET,
//     { expiresIn: '10m' } // Optional expiry
//   );

//   const authUrl = `https://auth.monday.com/oauth2/authorize?client_id=${process.env.MONDAY_CLIENT_ID}&state=${state}`;
//   res.redirect(authUrl);
// });


// router.get('/oauth/callback', async (req, res) => {
//   const { code, state } = req.query;

//   try {
//     const decoded = jwt.verify(state, process.env.MONDAY_SIGNING_SECRET);
//     const { userId, accountId, backToUrl } = decoded;

//     const tokenResponse = await monday.oauthToken(
//       code,
//       process.env.CLIENT_ID,
//       process.env.CLIENT_SECRET
//     );

//     // Store tokens as needed, e.g. TokenService.set(userId, tokenResponse)

//     // Redirect user back to original location
//     res.redirect(backToUrl || '/');
//   } catch (err) {
//     console.error('OAuth callback error:', err.message);
//     res.status(400).send('OAuth callback failed');
//   }
// });

router.get('/auth', async (req, res) => {
  const { token } = req.query;
  const { userId, accountId, backToUrl } = jwt.verify(token, process.env.MONDAY_SIGNING_SECRET);
  const accessToken = await secureStorage.get(userId);
  if (accessToken) {
    return res.redirect(backToUrl); 
  } else {
    const authUrl = `https://auth.monday.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&state=${token}`;

    res.redirect(authUrl);
  }
});

router.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  const { userId, accountId, backToUrl } = jwt.verify(state, process.env.MONDAY_SIGNING_SECRET);
  const token = await monday.oauthToken(code, process.env.CLIENT_ID, process.env.CLIENT_SECRET);
  await secureStorage.set(userId, token.access_token);
  res.redirect(backToUrl);
});

module.exports = router;
