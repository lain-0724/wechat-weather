const cron = require('node-cron');
const logger = require('../utils/logger');
const wechatService = require('./wechat');
const weatherService = require('./weather');

class SchedulerService {
  constructor() {
    this.tasks = [];
    // Schedule for Lain in Wuxi (Asia/Shanghai timezone) - 10:00 AM
    this.schedules = [
      {
        person: 'Lain',
        timezone: 'Asia/Shanghai',
        time: '10:00',
        cronExpression: '0 10 * * *'
      },
      {
        person: 'Brother',
        timezone: 'America/Chicago',
        time: '10:00',
        cronExpression: '0 10 * * *'
      }
    ];
  }

  /**
   * Start all schedulers
   */
  start() {
    logger.info('Starting all schedulers...');
    
    this.schedules.forEach((schedule) => {
      logger.info(`Setting up scheduler for ${schedule.person}: ${schedule.time} ${schedule.timezone}`);
      logger.info(`Cron expression: ${schedule.cronExpression}`);

      const task = cron.schedule(schedule.cronExpression, async () => {
        logger.info(`=== Scheduled weather reminder triggered for ${schedule.person} ===`);
        await this.sendWeatherReminders();
      }, {
        timezone: schedule.timezone
      });

      this.tasks.push(task);
    });

    logger.info(`All schedulers started. Total tasks: ${this.tasks.length}`);
  }

  /**
   * Stop all schedulers
   */
  stop() {
    this.tasks.forEach(task => {
      if (task) {
        task.stop();
      }
    });
    logger.info('All schedulers stopped');
  }

  /**
   * Send weather reminders to both users
   */
  async sendWeatherReminders() {
    try {
      // Get weather for both locations
      const locations = [
        {
          id: 'person1',
          latitude: parseFloat(process.env.PERSON1_LATITUDE),
          longitude: parseFloat(process.env.PERSON1_LONGITUDE),
          location: process.env.PERSON1_LOCATION,
          name: process.env.PERSON1_NAME,
          openid: process.env.PERSON1_OPENID,
          timezone: 'Asia/Shanghai'
        },
        {
          id: 'person2',
          latitude: parseFloat(process.env.PERSON2_LATITUDE),
          longitude: parseFloat(process.env.PERSON2_LONGITUDE),
          location: process.env.PERSON2_LOCATION,
          name: process.env.PERSON2_NAME,
          openid: process.env.PERSON2_OPENID,
          timezone: 'America/Chicago'
        }
      ];

      // Fetch weather data
      logger.info('Fetching weather data for both locations...');
      const weatherDataList = await Promise.all([
        weatherService.getCurrentWeather(
          locations[0].latitude,
          locations[0].longitude,
          locations[0].location
        ),
        weatherService.getCurrentWeather(
          locations[1].latitude,
          locations[1].longitude,
          locations[1].location
        )
      ]);

      // Send messages to both users
      logger.info('Sending weather reminders to both users...');
      await Promise.all([
        this._sendMessageToUser(locations[0], weatherDataList[0], weatherDataList[1]),
        this._sendMessageToUser(locations[1], weatherDataList[1], weatherDataList[0])
      ]);

      logger.info('=== Weather reminders sent successfully ===');
    } catch (error) {
      logger.error('Error sending weather reminders:', error.message);
    }
  }

  /**
   * Send message to a single user with both locations' weather
   */
  async _sendMessageToUser(userLocation, userWeather, partnerWeather) {
    try {
      const now = new Date();
      const userTimeString = now.toLocaleString('zh-CN', {
        timeZone: userLocation.timezone
      });

      const templateData = {
        first: {
          value: `Hi ${userLocation.name}! Here's today's weather for you both`,
          color: '#173177'
        },
        your_location: {
          value: `${userLocation.location}: ${userWeather.text}, ${userWeather.temp}°C`,
          color: '#173177'
        },
        your_weather: {
          value: `Humidity: ${userWeather.humidity}%, Wind: ${userWeather.windSpeed} km/h`,
          color: '#173177'
        },
        partner_location: {
          value: `${partnerWeather.location}: ${partnerWeather.text}, ${partnerWeather.temp}°C`,
          color: '#173177'
        },
        partner_weather: {
          value: `Humidity: ${partnerWeather.humidity}%, Wind: ${partnerWeather.windSpeed} km/h`,
          color: '#173177'
        },
        time: {
          value: userTimeString,
          color: '#173177'
        },
        remark: {
          value: `${userWeather.remark} Stay safe!`,
          color: '#173177'
        }
      };

      await wechatService.sendTemplateMessage(userLocation.openid, templateData);
      logger.info(`Message sent to ${userLocation.name} (${userLocation.openid}) in ${userLocation.timezone}`);
    } catch (error) {
      logger.error(`Failed to send message to ${userLocation.name}:`, error.message);
    }
  }
}

module.exports = new SchedulerService();
