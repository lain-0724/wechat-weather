# WeChat Weather Auto-Push Template

An automated WeChat message service that sends daily weather reminders to followers at a scheduled time every day.

## Features

- 🌤️ **Daily Weather Updates**: Sends weather information for two locations
- ⏰ **Scheduled Delivery**: Configurable daily reminder time (default: 10:00 AM)
- 📍 **Multi-Location Support**: Track weather for two different locations
- 🔄 **Automatic Retry**: Built-in error handling and retry logic
- 📊 **Rich Weather Data**: Includes temperature, humidity, wind speed, and helpful remarks
- ☁️ **Cloud Ready**: Designed for AWS EC2 deployment
- 📝 **Comprehensive Logging**: Detailed logs for monitoring and debugging
- 👥 **Official Account Integration**: Users follow the account to receive notifications automatically
- 🎛️ **Subscription Management**: Users can subscribe/unsubscribe via commands

## Architecture

```
┌────────────────────────────────────────────┐
│    WeChat Official Account Server          │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Express.js HTTP Server (Port 3000)  │  │
│  └──────────────────────────────────────┘  │
│           │                    │           │
│           ▼                    ▼           │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │  Follow/Unfollow│  │ Command Handler  │ │
│  │  Event Handler  │  │ (subscribe/info) │ │
│  └─────────────────┘  └──────────────────┘ │
│           │                    │           │
│           └────────┬───────────┘           │
│                    ▼                       │
│          ┌──────────────────┐              │
│          │ User Management  │              │
│          │ Service          │              │
│          └──────────────────┘              │
│                    │                       │
│                    ▼                       │
│        ┌───────────────────────┐           │
│        │  Cron Scheduler       │           │
│        │  (Dual Timezone)      │           │
│        │  10:00 AM Each Zone   │           │
│        └───────────────────────┘           │
│           │                   │            │
│           ▼                   ▼            │
│    ┌─────────────────────────────────┐    │
│    │  Weather API Integration        │    │
│    │  WeChat Template Message API    │    │
│    └─────────────────────────────────┘    │
│                                            │
└────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    Weather Data         WeChat Users
    (Multiple Cities)    Get Messages
```

## Prerequisites

- Node.js 14.x or higher
- NPM or Yarn
- WeChat Official Account (Subscription Account or Service Account)
- Wind Weather API Key (from weatherapi.com)
- AWS EC2 instance or any Linux/Windows server with public IP
- Domain name with SSL certificate (recommended)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lain-0724/wechat-weather.git
   cd wechat-weather
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your .env file**
   ```bash
   nano .env
   ```

## WeChat Official Account Setup

### Step 1: Create WeChat Official Account

1. Go to [WeChat Official Account Platform](https://mp.weixin.qq.com/)
2. Sign up for a new account (Subscription or Service Account)
3. Complete verification
4. Get your App ID and App Secret from Settings

### Step 2: Configure Server URL

1. Log in to WeChat Official Account backend
2. Go to **Settings** > **Server Configuration**
3. Fill in the following:
   - **Server Address (URL)**: `https://yourdomain.com/wechat/callback`
   - **Token**: Generate a random string (use in .env as WECHAT_TOKEN)
   - **EncodingAESKey**: Generate or provide your key (use in .env as WECHAT_ENCODING_AES_KEY)
   - **Message Encryption Mode**: Choose "Compatible Mode" or "Safe Mode"
4. Click **Submit**

### Step 3: Create Template Messages

1. Go to **Functionality** > **Template Messages**
2. Create a new template with fields:
   - `first`: Message header
   - `your_location`: Your city weather
   - `your_weather`: Your weather details
   - `partner_location`: Partner city weather
   - `partner_weather`: Partner weather details
   - `time`: Current time
   - `remark`: Additional remarks

3. Save the Template ID to your .env file

### Step 4: Get User OpenIDs

1. Users follow your Official Account
2. When they follow, they automatically get added to the system
3. Their OpenID is captured automatically on follow event
4. For your primary users (Lain and Brother), get their OpenIDs from WeChat Official Account backend > "Users" section

## Configuration

### Environment Variables

```bash
# WeChat Official Account
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
WECHAT_TEMPLATE_ID=your_template_id
WECHAT_TOKEN=your_token_for_validation
WECHAT_ENCODING_AES_KEY=your_encoding_aes_key

# Primary User 1 (Lain - Wuxi, China)
PERSON1_OPENID=openid_for_lain
PERSON1_NAME=Lain
PERSON1_LOCATION=Wuxi, China
PERSON1_LATITUDE=31.5754
PERSON1_LONGITUDE=120.3155

# Primary User 2 (Brother - Chicago, USA)
PERSON2_OPENID=openid_for_brother
PERSON2_NAME=Brother
PERSON2_LOCATION=Chicago, USA
PERSON2_LATITUDE=41.8781
PERSON2_LONGITUDE=-87.6298

# Weather API
WIND_WEATHER_API_KEY=your_weather_api_key

# Server
PORT=3000
NODE_ENV=production

# Schedule (sends at 10:00 AM in each person's timezone)
SCHEDULE_TIME=10:00
TIMEZONE=Asia/Shanghai

# Logging
LOG_LEVEL=info
```

## Running the Service

### Local Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## How It Works

### 1. Users Follow Your Account

- User scans QR code or searches for your Official Account
- User clicks "Follow"
- System receives `subscribe` event
- User automatically added to system with welcome message

### 2. User Commands

Users can send text commands:

- **subscribe**: Enable daily weather notifications
- **unsubscribe**: Disable notifications
- **info**: View service information

### 3. Automatic Scheduling

- **Lain (Wuxi, China)**: Receives message daily at 10:00 AM Shanghai time
- **Brother (Chicago, USA)**: Receives message daily at 10:00 AM Chicago time
- Each receives weather for both locations

### 4. Message Flow

```
Daily at 10:00 AM [Timezone]
        ↓
Fetch weather for Wuxi & Chicago
        ↓
Send personalized message:
  - Your location's weather
  - Partner's location's weather
  - Local time
  - Helpful remarks
```

## Deployment on AWS EC2

### 1. Set up EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install nginx (reverse proxy)
sudo yum install -y nginx
```

### 2. Configure Domain & SSL

```bash
# Install certbot for SSL
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --nginx -d yourdomain.com
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/lain-0724/wechat-weather.git
cd wechat-weather

# Install dependencies
npm install --production

# Create .env file
cp .env.example .env

# Edit with your configuration
sudo nano .env
```

### 4. Configure Nginx

Create `/etc/nginx/sites-available/wechat-weather`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/wechat-weather /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### 5. Setup Systemd Service

Create `/etc/systemd/system/wechat-weather.service`:

```ini
[Unit]
Description=WeChat Weather Reminder Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/wechat-weather
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=30
EnvironmentFile=/home/ec2-user/wechat-weather/.env
StandardOutput=append:/var/log/wechat-weather.log
StandardError=append:/var/log/wechat-weather.log

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable wechat-weather
sudo systemctl start wechat-weather
```

## Monitoring

### Check Service Status

```bash
sudo systemctl status wechat-weather
```

### View Logs

```bash
# Application logs
tail -f logs/app-*.log

# Systemd logs
sudo journalctl -u wechat-weather -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Health Check

```bash
curl https://yourdomain.com/health
```

## File Structure

```
wechat-weather/
├── src/
│   ├── services/
│   │   ├── wechat.js                 # WeChat Template API
│   │   ├── wechatOfficialAccount.js  # Official Account events
│   │   ├── weather.js                # Weather API
│   │   ├── scheduler.js              # Dual-timezone scheduler
│   │   └── user.js                   # User management
│   ├── routes/
│   │   └── wechat.js                 # Webhook endpoints
│   ├── utils/
│   │   └── logger.js                 # Logging
│   └── index.js                      # Entry point
├── logs/                             # Application logs
├── .env.example                      # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Troubleshooting

### WeChat Server Verification Failed

1. Check if token matches in WeChat backend
2. Verify domain is accessible publicly
3. Check firewall rules on EC2
4. Ensure HTTPS is working

### Messages Not Sending

1. Verify access token is valid
2. Check if Official Account is verified
3. Verify OpenID format
4. Check template ID exists and is correct
5. View logs: `tail -f logs/app-*.log`

### Scheduler Not Triggering

1. Check service is running: `systemctl status wechat-weather`
2. Verify timezone is correct
3. Check cron expression in logs
4. Ensure server time is synchronized: `date`

### User Not Receiving Messages

1. Verify user followed the account
2. Check if user is in active subscribers list
3. Verify coordinates are correct
4. Check weather API quota
5. Check network connectivity

## API References

- [WeChat Official Account API](https://developers.weixin.qq.com/doc/offiaccount/)
- [WeChat Message Handling](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_messages.html)
- [Weather API Documentation](https://www.weatherapi.com/docs/)
- [Node-cron Documentation](https://github.com/kelektiv/node-cron)
- [Express.js Guide](https://expressjs.com/)

## Performance Considerations

- Memory footprint: ~100MB with all services running
- Single cron job per timezone
- Cached WeChat access tokens (2-hour validity)
- Graceful error handling
- t3.small EC2 instance recommended

## Security Best Practices

1. Never commit `.env` file
2. Use HTTPS for all connections
3. Enable firewall rules (only 80, 443)
4. Rotate WeChat App Secret regularly
5. Keep dependencies updated: `npm audit fix`
6. Use strong WECHAT_TOKEN
7. Enable SSL certificate auto-renewal

## License

MIT License

## Contributing

Contributions welcome! Please submit pull requests.

## Support

For issues:
- Open GitHub issue
- Check logs for errors
- Verify WeChat backend settings
