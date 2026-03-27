const nodemailer = require("nodemailer");
// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "6e40031bddf1ae",
        pass: "cbdd721a4c7683",
    },
});
//http://localhost:3000/api/v1/auth/resetpassword/a87edf6812f235e997c7b751422e6b2f5cd95aa994c55ebeeb931ca67214d645

// Send an email using async/await;
module.exports = {
    sendMail: async function (to,url) {
        const info = await transporter.sendMail({
            from: 'admin@hehehe.com',
            to: to,
            subject: "reset pass",
            text: "click vo day de doi pass", // Plain-text version of the message
            html: "click vo <a href="+url+">day</a> de doi pass", // HTML version of the message
        });
    },
    sendPasswordMail: async function (to, username, password) {
        await transporter.sendMail({
            from: 'admin@hehehe.com',
            to: to,
            subject: "Thông tin tài khoản hệ thống",
            text: `Chào ${username}, tài khoản của bạn đã được khởi tạo. Mật khẩu: ${password}`,
            html: `
                <h3>Chào ${username},</h3>
                <p>Tài khoản của bạn trên hệ thống đã được khởi tạo thành công.</p>
                <ul>
                    <li><b>Tên đăng nhập:</b> ${username}</li>
                    <li><b>Mật khẩu:</b> <span style="color: red;">${password}</span></li>
                </ul>
                <p>Vui lòng đăng nhập và đổi mật khẩu để bảo mật tài khoản.</p>
            `,
        });
    }
}
