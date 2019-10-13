'use strict';

console.log('Starting SES Bouncer');

const AWS = require('aws-sdk');
const HTTPS = require('https');

exports.handler = (event, context, callback) => {
  const sesNotification = event.Records[0].ses;
  const messageId = sesNotification.mail.messageId;
  const receipt = sesNotification.receipt;

  console.log('Processing bounce for message: ' + messageId);

  receipt.recipients.forEach(function (origEmail) {
    console.log('Checking mailbox existance for:', origEmail);
    const email = origEmail;
    const request = HTTPS.get("https://your-api.com/email/" + origEmail, function (response) {
      const statusCode = response.statusCode;
      console.log(`Mailbox existance check result: ${messageId} is ${statusCode}`);

      if (statusCode >= 200 && statusCode < 300) {
        console.log('Accepting message: ' + messageId);
        callback();
        return;
      }

      const domain = email.substring(email.lastIndexOf("@") + 1);
      const sendBounceParams = {
        BounceSender: `mailer-daemon@${domain}`,
        OriginalMessageId: messageId,
        MessageDsn: {
          ReportingMta: `dns; ${domain}`,
          ArrivalDate: new Date(),
          ExtensionFields: [],
        },
        BouncedRecipientInfoList: [{
          Recipient: email,
          BounceType: 'DoesNotExist',
        }],
      };

      console.log('Bouncing message with parameters: ' + JSON.stringify(sendBounceParams, null, 2));

      new AWS.SES().sendBounce(sendBounceParams, (err, data) => {
        if (err) {
          // If something goes wrong, log the issue.
          console.log(`An error occurred while sending bounce for message: ${messageId}`, err);
          callback(err);
        } else {
          // Otherwise, log the message ID for the bounce email.
          console.log(`Bounce for message ${messageId} sent, bounce message ID: ${data.MessageId}`);
          // Stop processing additional receipt rules in the rule set.
          callback(null, {
            disposition: 'stop_rule_set',
          });
        }
      });
    });

    request.on("error", function (error) {
      console.log(`An error occurred while checking mailbox existance for message: ${messageId}`, error);
      callback(error);
    });
  });

  console.log('Accepting message: ' + messageId);
  callback();
};
