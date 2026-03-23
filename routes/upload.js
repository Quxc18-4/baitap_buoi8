var express = require("express");
var router = express.Router();
let { uploadImage, uploadExcel } = require('../utils/uploadHandler')
let path = require('path')
let fs = require('fs')
let exceljs = require('exceljs')
let productModel = require('../schemas/products')
let InventoryModel = require('../schemas/inventories')
const { default: mongoose } = require('mongoose');
var slugify = require('slugify')
let crypto = require('crypto');
let UserModel = require('../schemas/users');
let RoleModel = require('../schemas/roles');
let mailHandler = require('../utils/mailHandler');

router.post('/single', uploadImage.single('file'), function (req, res, next) {
    if (!req.file) {
        res.status(404).send({
            message: "file not found"
        })
    }
    res.send({
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
    })
})
router.post('/multiple', uploadImage.array('files', 5), function (req, res, next) {
    if (!req.files) {
        res.status(404).send({
            message: "file not found"
        })
    }
    console.log(req.files);
    let filesInfor = req.files.map(e => {
        return {
            filename: e.filename,
            path: e.path,
            size: e.size
        }
    })
    res.send(filesInfor)
})
router.get('/:filename', function (req, res, next) {
    let pathFile = path.join(__dirname, '../uploads', req.params.filename)
    res.sendFile(pathFile)
})

// Nhớ giữ nguyên các require ở đầu file nhé!

router.post('/excel/users', uploadExcel.single('file'), async function (req, res, next) {
    if (!req.file) {
        return res.status(400).send({ message: "Vui lòng đính kèm file Excel (.xlsx)" });
    }

    let filePath = path.join(__dirname, '../uploads', req.file.filename);
    let errors = [];
    let successCount = 0;

    try {
        // 1. Lấy Role mặc định
        let defaultRole = await RoleModel.findOne({ name: 'user' });
        if (!defaultRole) defaultRole = await RoleModel.findOne();
        
        if (!defaultRole) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).send({ message: "Hệ thống chưa có Role nào." });
        }

        // 2. Đọc file
        let workBook = new exceljs.Workbook();
        await workBook.xlsx.readFile(filePath);
        let workSheet = workBook.worksheets[0];

        // 3. Duyệt từng dòng (Bắt đầu từ 2)
        for (let index = 2; index <= workSheet.rowCount; index++) {
            let row = workSheet.getRow(index);

            // TUYỆT CHIÊU: Dùng .text để ép lấy chữ hiển thị thực tế
            let rawUsername = row.getCell(1).text; 
            let rawEmail = row.getCell(2).text;    

            // Bỏ qua dòng rỗng
            if (!rawUsername || !rawEmail) continue;

            // LÀM SẠCH TUYỆT ĐỐI: Xóa mọi dấu cách tàng hình, dấu xuống dòng, chữ mailto:
            let username = rawUsername.toString().trim();
            let email = rawEmail.toString().replace(/\s+/g, '').replace('mailto:', '').toLowerCase();

            // IN RA TERMINAL ĐỂ KIỂM TRA (Debug)
            console.log(`[Dòng ${index}] Chuẩn bị lưu -> User: ${username} | Email: ${email}`);

            let plainPassword = crypto.randomBytes(8).toString('hex');

            try {
                let newUser = new UserModel({
                    username: username,
                    email: email,
                    password: plainPassword,
                    role: defaultRole._id
                });

                await newUser.save();
                await mailHandler.sendNewAccountMail(email, username, plainPassword);
                successCount++;
            } catch (err) {
                console.error(`Lỗi Mongoose dòng ${index}:`, err.message);
                errors.push(`Dòng ${index} (${username}): ${err.message}`);
            }
        }

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.status(200).send({
            message: `Import hoàn tất. Thành công: ${successCount} users.`,
            errors: errors.length > 0 ? errors : "Không có lỗi nào."
        });

    } catch (error) {
        console.error("Lỗi hệ thống:", error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).send({ message: "Có lỗi khi đọc file.", error: error.message });
    }
});

module.exports = router;