const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const i18n = require('i18n')
const User = require('../models/user')
const { buildErrObject } = require('../middleware/utils')

module.exports = {
  /**
   * Checks User model if user with an specific email exists
   * @param {string} email - user email
   */
  async emailExists(email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email
        },
        (err, item) => {
          if (err) {
            reject(buildErrObject(422, err.message))
          }
          if (item) {
            reject(buildErrObject(422, 'EMAIL_ALREADY_EXISTS'))
          }
          resolve(false)
        }
      )
    })
  },

  /**
   * Checks User model if user with an specific email exists but excluding user id
   * @param {string} id - user id
   * @param {string} email - user email
   */
  async emailExistsExcludingMyself(id, email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email,
          _id: {
            $ne: id
          }
        },
        (err, item) => {
          if (err) {
            reject(buildErrObject(422, err.message))
          }
          if (item) {
            reject(buildErrObject(422, 'EMAIL_ALREADY_EXISTS'))
          }
          resolve(false)
        }
      )
    })
  },

  /**
   * Sends email
   * @param {Object} data - data
   * @param {boolean} callback - callback
   */
  async sendEmail(data, callback) {
    const auth = {
      auth: {
        // eslint-disable-next-line camelcase
        api_key: process.env.EMAIL_SMTP_API_MAILGUN,
        domain: process.env.EMAIL_SMTP_DOMAIN_MAILGUN
      }
    }
    const transporter = nodemailer.createTransport(mg(auth))
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${
        process.env.EMAIL_FROM_ADDRESS
      }>`,
      to: `${data.user.name} <${data.user.email}>`,
      subject: data.subject,
      html: data.htmlMessage
    }
    transporter.sendMail(mailOptions, err => {
      if (err) {
        return callback(false)
      }
      return callback(true)
    })
  },

  /**
   * Sends registration email
   * @param {string} locale - locale
   * @param {Object} user - user object
   */
  async sendRegistrationEmailMessage(locale, user) {
    i18n.setLocale(locale)
    const subject = i18n.__('registration.SUBJECT')
    const htmlMessage = i18n.__(
      'registration.MESSAGE',
      user.name,
      process.env.FRONTEND_URL,
      user.verification
    )
    const data = {
      user,
      subject,
      htmlMessage
    }
    const email = {
      subject,
      htmlMessage,
      verification: user.verification
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendEmail(data, messageSent =>
        messageSent
          ? console.log(`Email SENT to: ${user.email}`)
          : console.log(`Email FAILED to: ${user.email}`)
      )
    } else if (process.env.NODE_ENV === 'development') {
      console.log(email)
    }
  },

  /**
   * Sends reset password email
   * @param {string} locale - locale
   * @param {Object} user - user object
   */
  async sendResetPasswordEmailMessage(locale, user) {
    i18n.setLocale(locale)
    const subject = i18n.__('forgotPassword.SUBJECT')
    const htmlMessage = i18n.__(
      'forgotPassword.MESSAGE',
      user.email,
      process.env.FRONTEND_URL,
      user.verification
    )
    const data = {
      user,
      subject,
      htmlMessage
    }
    const email = {
      subject,
      htmlMessage,
      verification: user.verification
    }
    if (process.env.NODE_ENV === 'production') {
      this.sendEmail(data, messageSent =>
        messageSent
          ? console.log(`Email SENT to: ${user.email}`)
          : console.log(`Email FAILED to: ${user.email}`)
      )
    } else if (process.env.NODE_ENV === 'development') {
      console.log(email)
    }
  }
}