const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "c140806d2f3f3f",
        pass: "c1e3e5f797c34e",
    },
});

module.exports = {
    sendMail: async function (to, url) {
        const info = await transporter.sendMail({
            from: 'admin@heha.com',
            to: to,
            subject: "Reset Password email",
            text: "click vao day de reset password", // Plain-text version of the message
            html: "click vao <a href=" + url + ">day</a> de reset password", // HTML version of the message
        });
    },

    sendNewAccountMail: async function (to, username, password) {
        const info = await transporter.sendMail({
            from: '"Admin" <admin@heha.com>',
            to: to,
            subject: "Thông tin tài khoản hệ thống của bạn",
            text: `Chào ${username},\n\nTài khoản của bạn đã được tạo thành công.\n- Username: ${username}\n- Password: ${password}\n\nVui lòng bảo mật thông tin này.`, 
        });
        return info;
    }
}