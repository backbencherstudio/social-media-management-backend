export default () => ({
  app: {
    name: process.env.APP_NAME,
    key: process.env.APP_KEY,
    url: process.env.APP_URL,
    client_app_url: process.env.CLIENT_APP_URL,
    port: parseInt(process.env.PORT, 10) || 3000,
  },

  fileSystems: {
    public: {},
    s3: {
      driver: 's3',
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_DEFAULT_REGION,
      bucket: process.env.AWS_BUCKET,
      url: process.env.AWS_URL,
      endpoint: process.env.AWS_ENDPOINT,
    },
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT,
  },

  security: {
    salt: 10,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: process.env.JWT_EXPIRY,
  },

  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    user: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM_NAME,
  },

  auth: {
    google: {
      app_id: process.env.GOOGLE_APP_ID,
      app_secret: process.env.GOOGLE_APP_SECRET,
      callback: process.env.GOOGLE_CALLBACK_URL,
    },
    facebook: {
      app_id: process.env.FACEBOOK_APP_ID,
      app_secret: process.env.FACEBOOK_APP_SECRET,
      callback: process.env.FACEBOOK_CALLBACK_URL,
    },
    instagram: {
      app_id: process.env.INSTAGRAM_CLIENT_ID,
      app_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      callback: process.env.INSTAGRAM_CALLBACK_URL,
    },
    twitter: {
      app_id: process.env.TWITTER_API_KEY,
      app_secret: process.env.TWITTER_API_SECRET,
      callback: process.env.TWITTER_CALLBACK_URL,
      access_token: process.env.TWITTER_ACCESS_TOKEN,
      access_secret: process.env.TWITTER_ACCESS_SECRET
    },
    linkedin: {
      app_id: process.env.LINKEDIN_CLIENT_ID,
      app_secret: process.env.LINKEDIN_CLIENT_SECRET,
      callback: process.env.LINKEDIN_CALLBACK_URL,
    },
  },

  payment: {
    stripe: {
      secret_key: process.env.STRIPE_SECRET_KEY,
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },

  /**
   * Storage directory
   */
  storageUrl: {
    rootUrl: './public/storage',
    rootUrlPublic: '/public/storage',
    // storage directory
    package: '/package/',
    destination: '/destination/',
    blog: '/blog/',
    avatar: '/avatar/',
    websiteInfo: '/website-info/',
    // chat
    attachment: '/attachment/',
  },

  defaultUser: {
    system: {
      username: process.env.SYSTEM_USERNAME,
      email: process.env.SYSTEM_EMAIL,
      password: process.env.SYSTEM_PASSWORD,
    },
  },
});
