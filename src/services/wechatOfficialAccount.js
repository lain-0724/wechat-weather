const crypto = require('crypto');
const logger = require('../utils/logger');

class WeChatOfficialAccountService {
  constructor() {
    this.token = process.env.WECHAT_TOKEN;
    this.encodingAESKey = process.env.WECHAT_ENCODING_AES_KEY;
    this.appId = process.env.WECHAT_APP_ID;
  }

  /**
   * Validate WeChat server signature
   * Required for first-time server verification
   */
  validateSignature(signature, timestamp, nonce) {
    const arr = [this.token, timestamp, nonce].sort();
    const str = arr.join('');
    const sha1 = crypto.createHash('sha1').update(str).digest('hex');
    return sha1 === signature;
  }

  /**
   * Generate follow response message
   */
  generateFollowResponse(fromUserName) {
    const toUserName = fromUserName;
    const createTime = Math.floor(Date.now() / 1000);
    const msgType = 'text';
    const content = `Welcome! \ud83c\udf1f\n\nYou've successfully followed our Weather Reminder service!\n\nYou will receive daily weather updates at 10:00 AM your local time for both Wuxi, China and Chicago, USA.\n\nTo manage your subscription, reply with:\n- 'subscribe' to enable notifications\n- 'unsubscribe' to disable notifications\n- 'info' to view your current settings`;

    return this._generateXMLResponse(fromUserName, toUserName, createTime, msgType, content);
  }

  /**
   * Generate unfollow acknowledgement
   */
  generateUnfollowResponse() {
    logger.info('User has unfollowed the official account');
    // No response needed for unfollow
    return '';
  }

  /**
   * Handle subscription management commands
   */
  handleSubscriptionCommand(command, fromUserName) {
    const toUserName = fromUserName;
    const createTime = Math.floor(Date.now() / 1000);
    const msgType = 'text';
    let content = '';

    switch (command.toLowerCase().trim()) {
      case 'subscribe':
        content = `✅ Notifications enabled!\n\nYou will receive weather updates at 10:00 AM daily.`;
        logger.info(`User ${fromUserName} enabled notifications`);
        break;
      case 'unsubscribe':
        content = `⏸️ Notifications disabled.\n\nYou can re-enable anytime by replying with 'subscribe'.`;
        logger.info(`User ${fromUserName} disabled notifications`);
        break;
      case 'info':
        content = `ℹ️ Weather Reminder Service Info\n\nLocations: Wuxi, China & Chicago, USA\nSchedule: 10:00 AM daily (your local time)\nStatus: Active\n\nCommands:\n- subscribe\n- unsubscribe\n- info`;
        break;
      default:
        content = `❓ Unknown command. Available commands:\n- subscribe\n- unsubscribe\n- info\n\nReply with 'info' for more details.`;
    }

    return this._generateXMLResponse(fromUserName, toUserName, createTime, msgType, content);
  }

  /**
   * Generate XML response for WeChat
   */
  _generateXMLResponse(fromUserName, toUserName, createTime, msgType, content) {
    return `<xml>
      <ToUserName><![CDATA[${toUserName}]]></ToUserName>
      <FromUserName><![CDATA[${fromUserName}]]></FromUserName>
      <CreateTime>${createTime}</CreateTime>
      <MsgType><![CDATA[${msgType}]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
    </xml>`;
  }
}

module.exports = new WeChatOfficialAccountService();
