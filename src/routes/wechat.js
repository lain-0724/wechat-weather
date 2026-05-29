const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const logger = require('../utils/logger');
const wechatOAService = require('../services/wechatOfficialAccount');
const userService = require('../services/user');

const router = express.Router();
const xmlParser = new xml2js.Parser();
const xmlBuilder = new xml2js.Builder();

/**
 * GET /wechat/callback
 * WeChat server verification endpoint
 * Required: signature, timestamp, nonce, echostr
 */
router.get('/callback', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  logger.info('Received WeChat verification request', { signature, timestamp, nonce });

  try {
    if (wechatOAService.validateSignature(signature, timestamp, nonce)) {
      logger.info('WeChat signature validation successful');
      res.send(echostr);
    } else {
      logger.error('WeChat signature validation failed');
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    logger.error('Error validating WeChat signature:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /wechat/callback
 * Receive messages and events from WeChat Official Account
 * Handles: follow, unfollow, text messages
 */
router.post('/callback', async (req, res) => {
  try {
    const xmlData = req.body;
    
    logger.info('Received WeChat message/event:', JSON.stringify(xmlData));

    // Parse XML to JSON
    const data = await xmlParser.parseStringPromise(xmlData);
    const message = data.xml;

    const msgType = message.MsgType[0];
    const fromUserName = message.FromUserName[0];
    const toUserName = message.ToUserName[0];
    const content = message.Content ? message.Content[0] : '';
    const event = message.Event ? message.Event[0] : null;

    let responseXml = '';

    // Handle subscribe event
    if (msgType === 'event' && event === 'subscribe') {
      logger.info(`User ${fromUserName} followed the account`);
      
      // Add user to subscription list
      await userService.addSubscriber(fromUserName);
      
      responseXml = wechatOAService.generateFollowResponse(fromUserName);
    }
    // Handle unsubscribe event
    else if (msgType === 'event' && event === 'unsubscribe') {
      logger.info(`User ${fromUserName} unfollowed the account`);
      
      // Remove user from subscription list
      await userService.removeSubscriber(fromUserName);
      
      responseXml = wechatOAService.generateUnfollowResponse();
    }
    // Handle text messages (commands)
    else if (msgType === 'text') {
      logger.info(`Received text message from ${fromUserName}: ${content}`);
      responseXml = wechatOAService.handleSubscriptionCommand(content, fromUserName);
    }
    // Handle other events (like scan QR code, click menu, etc.)
    else if (msgType === 'event') {
      logger.info(`Received event: ${event} from ${fromUserName}`);
      responseXml = '';
    }

    // Send response
    if (responseXml) {
      res.set('Content-Type', 'text/xml');
      res.send(responseXml);
    } else {
      res.send('success');
    }
  } catch (error) {
    logger.error('Error processing WeChat message:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
