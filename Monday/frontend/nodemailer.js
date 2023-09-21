const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    pool: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: '@gmail.com',
        pass: '',
    },
});

const message = {
    from: 'צביקה <z0533113784@gmail.com>',
    to: 'e0527137056@gmail.com',
    subject: "בדיקה",
    html: "<h1>בדיקה חשובה</h1>"
};

transporter.sendMail(message, (err, info) => {
    if (err) {
        console.log(err);
    } else {
        console.log(info);
    }
})