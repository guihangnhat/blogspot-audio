import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

// Tăng giới hạn thời gian thực thi của Vercel (nếu dùng bản Pro)
export const maxDuration = 30;

export async function POST(request) {
try {
const formData = await request.formData();
const file = formData.get('file');

if (!file) {
return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 });
}

// Kiểm tra định dạng file MP3
if (!file.type.includes('audio') && !file.name.endsWith('.mp3')) {
return NextResponse.json({ error: 'Chỉ chấp nhận file MP3' }, { status: 400 });
}

// 1. Chuyển File object thành Buffer
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);

// 2. Kết nối tới DB và tạo GridFSBucket
const client = await clientPromise;
const db = client.db('music_database'); // Đổi tên DB của bạn
const bucket = new GridFSBucket(db, {
bucketName: 'audio_files', // Tạo collection audio_files.files và audio_files.chunks
});

// 3. Tạo readable stream từ Buffer
const stream = Readable.from(buffer);

// 4. Mở stream upload lên GridFS
const filename = `${Date.now()}-${file.name}`;
const uploadStream = bucket.openUploadStream(filename, {
contentType: file.type || 'audio/mpeg',
metadata: {
originalName: file.name,
uploadedAt: new Date(),
},
});

// 5. Đưa dữ liệu qua stream
await new Promise((resolve, reject) => {
stream
.pipe(uploadStream)
.on('error', reject)
.on('finish', resolve);
});

return NextResponse.json({
message: 'Upload file MP3 thành công!',
fileId: uploadStream.id,
filename: filename,
});
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
