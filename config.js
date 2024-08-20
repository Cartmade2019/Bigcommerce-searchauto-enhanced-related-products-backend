// config.js
require('dotenv').config();

const config = {
  defaultImageUrl: process.env.DEFAULTIMAGEURL || '',
  appStylesheetUrl: process.env.APPSTYLESHEETURL || '',
};

module.exports = { config };