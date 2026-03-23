const mongoose = require('mongoose');

// Kết nối chính xác vào database mà app.js của bạn đang dùng
const dbURI = 'mongodb://localhost:27017/NNPTUD-S2';

// Định nghĩa nhanh Schema Role ngay trong file này để chạy độc lập
// (Dùng tên 'role' để khớp với ref: "role" trong users_schem của bạn)
const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String }
}, { timestamps: true });

// Khởi tạo model
const Role = mongoose.models.role || mongoose.model('role', roleSchema);

async function seedRoles() {
    try {
        console.log("🔄 Đang kết nối tới database...");
        await mongoose.connect(dbURI);
        console.log("✅ Kết nối thành công!");

        const rolesToCreate = [
            { name: 'admin', description: 'Quản trị viên toàn quyền' },
            { name: 'user', description: 'Người dùng thông thường' }
        ];

        for (const roleData of rolesToCreate) {
            // Kiểm tra xem role đã tồn tại chưa để tránh tạo trùng lặp
            const existingRole = await Role.findOne({ name: roleData.name });
            if (!existingRole) {
                await Role.create(roleData);
                console.log(`✅ Đã tạo thành công Role: ${roleData.name}`);
            } else {
                console.log(`⚠️ Role '${roleData.name}' đã tồn tại trong database.`);
            }
        }

        console.log("🎉 Hoàn tất quá trình khởi tạo dữ liệu Roles!");
    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error.message);
    } finally {
        // Đóng kết nối để script tự động dừng và thoát terminal
        await mongoose.disconnect();
        console.log("🔌 Đã ngắt kết nối database.");
    }
}

seedRoles();