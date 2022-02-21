const nodemailer = require('nodemailer');
const debug = require('debug')('recipe-mate:utils-mail');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const generateHtml = (subject, resetUrl) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body>
    <div class="container" style="width: 75vw; text-align: center">
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p>
        If you can't click the above button please visit
        ${resetUrl}
      </p>
      <p>If you didn't request this email, please ignore it.</p>
    </div>
  </body>
</html>`;
  return html;
};

exports.sendMail = async (recipient, subject, resetUrl) => {
  debug(recipient, subject, resetUrl);
  let info = await transport.sendMail({
    from: '"Recipe-mate" <noreply@example.com>',
    to: recipient,
    subject,
    text: `Please visit- ${resetUrl}`,
    html: generateHtml(subject, resetUrl),
  });

  debug(info);
  return info;
};
