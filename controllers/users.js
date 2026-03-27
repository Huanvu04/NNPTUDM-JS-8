let userModel = require('../schemas/users');
let roleModel = require('../schemas/roles');
const path = require('path');
const xlsx = require('xlsx');
const crypto = require('crypto');
const mailHandler = require('../utils/senMailHandler');
module.exports = {
    CreateAnUser: function (username, password,
        email, role, fullname, avatar, status, logincount) {
        return new userModel(
            {
                username: username,
                password: password,
                email: email,
                fullName: fullname,
                avatarUrl: avatar,
                status: status,
                role: role,
                loginCount: logincount
            }
        )
    },
    FindByUsername: async function (username) {
        return await userModel.findOne({
            username: username,
            isDeleted: false
        })
    }, 
    FindByEmail: async function (email) {
        return await userModel.findOne({
            email: email,
            isDeleted: false
        })
    },
    FindByToken: async function (token) {
        return await userModel.findOne({
            resetPasswordToken: token,
            isDeleted: false
        })
    },
    FailLogin: async function (user) {
        user.loginCount++;
        if (user.loginCount == 3) {
            user.loginCount = 0;
            user.lockTime = new Date(Date.now() + 60 * 60 * 1000)
        }
        await user.save()
    },
    SuccessLogin: async function (user) {
        user.loginCount = 0;
        await user.save()
    },
    GetAllUser: async function () {
        return await userModel
            .find({ isDeleted: false }).populate({
                path: 'role',
                select: 'name'
            })
    },
    FindById: async function (id) {
        try {
            let getUser = await userModel
                .findOne({ isDeleted: false, _id: id }).populate({
                    path: 'role',
                    select: 'name'
                })
            return getUser;
        } catch (error) {
            return false
        }
    },
    ImportUserFromExcel: async function (filePath) {
        // Đọc workbook từ Excel
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Chuyển worksheet thành JSON
        const usersData = xlsx.utils.sheet_to_json(worksheet);

        let defaultRole = await roleModel.findOne({ name: 'user' }); 
        if (!defaultRole) {
            // Nếu trong DB chưa có, tự động tạo mới
            let newRole = new roleModel({
                name: 'user', 
                description: 'Quyền người dùng cơ bản'
            });
            defaultRole = await newRole.save();
            console.log("Đã tự động tạo role 'user' thành công!");
        }

        const importedUsers = [];
        const errors = [];

        for (const user of usersData) {
            // Dựa vào file excel pdf: cột là "username" và "email"
            const { username, email } = user;
            
            if (!username || !email) continue; // Bỏ qua nếu dòng thiếu dữ liệu

            try {
                // Kiểm tra xem User đã tồn tại chưa
                const existingUser = await userModel.findOne({ username });
                if (existingUser) {
                    errors.push(`User ${username} đã tồn tại`);
                    continue; 
                }

                // TẠO MẬT KHẨU NGẪU NHIÊN 16 KÍ TỰ
                // crypto.randomBytes(8) -> tạo chuỗi hexadecimal 16 kí tự
                const plainPassword = crypto.randomBytes(8).toString('hex');
            
                // sử dụng mật khẩu plainPassword.
                let newUser = this.CreateAnUser(
                    username, 
                    plainPassword, 
                    email, 
                    defaultRole._id, 
                    username, 
                    '', 
                    true,     
                    0
                );
                
                await newUser.save();
                importedUsers.push(username);

                // GỬI EMAIL THÔNG TIN TÀI KHOẢN VÀ MẬT KHẨU CHO USER
                await mailHandler.sendPasswordMail(email, username, plainPassword);

            } catch (err) {
                errors.push(`Lỗi import ${username}: ${err.message}`);
            }
        }

        return { 
            message: "Hoàn tất import", 
            successCount: importedUsers.length, 
            importedUsers, 
            errors 
        };
    }
}