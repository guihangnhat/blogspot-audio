import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { GridFSBucket } from 'mongodb';

export async function GET(request, { params }) {
try {
const { filename } = params;
const client = await clientPromise;
const db = client.db('music_database');
const bucket = new GridFSBucket(db, { bucketName: 'audio_files' });

// Tìm thông tin file
const files = await bucket.find({ filename }).toArray();
if (!files || files.length === 0) {
return NextResponse.json({ error: 'File không tồn tại' }, { status: 404 });
}

const file = files[0];

// Tạo stream đọc từ GridFS
const downloadStream = bucket.openDownloadStreamByName(filename);

// Trả về stream trực tiếp dưới định dạng Response Web API
return new Response(downloadStream, {
headers: {
'Content-Type': file.contentType || 'audio/mpeg',
'Content-Length': file.length.toString(),
},
});
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}