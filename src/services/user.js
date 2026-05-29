const logger = require('../utils/logger');

// Simple in-memory user storage
// In production, use a database like MongoDB
const subscribers = new Map();

class UserService {
  /**
   * Add subscriber to the system
   */
  async addSubscriber(openid) {
    try {
      if (!subscribers.has(openid)) {
        subscribers.set(openid, {
          openid: openid,
          subscribed: true,
          followTime: new Date(),
          lastMessageTime: null
        });
        logger.info(`Subscriber added: ${openid}`);
      }
      return subscribers.get(openid);
    } catch (error) {
      logger.error(`Failed to add subscriber ${openid}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove subscriber from the system
   */
  async removeSubscriber(openid) {
    try {
      if (subscribers.has(openid)) {
        subscribers.delete(openid);
        logger.info(`Subscriber removed: ${openid}`);
      }
    } catch (error) {
      logger.error(`Failed to remove subscriber ${openid}:`, error.message);
      throw error;
    }
  }

  /**
   * Get subscriber info
   */
  async getSubscriber(openid) {
    return subscribers.get(openid) || null;
  }

  /**
   * Get all active subscribers
   */
  async getAllSubscribers() {
    return Array.from(subscribers.values()).filter(sub => sub.subscribed);
  }

  /**
   * Update subscriber status
   */
  async updateSubscriber(openid, data) {
    try {
      const subscriber = subscribers.get(openid);
      if (subscriber) {
        subscribers.set(openid, { ...subscriber, ...data });
        logger.info(`Subscriber ${openid} updated`);
      }
      return subscribers.get(openid);
    } catch (error) {
      logger.error(`Failed to update subscriber ${openid}:`, error.message);
      throw error;
    }
  }

  /**
   * Get total subscriber count
   */
  getSubscriberCount() {
    return subscribers.size;
  }
}

module.exports = new UserService();
