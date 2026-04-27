const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function getMimeType(buffer) {
    const hex = buffer.toString('hex', 0, 4).toUpperCase();
    if (hex.startsWith('89504E47')) return 'image/png';
    if (hex.startsWith('FFD8FF')) return 'image/jpeg';
    if (hex.startsWith('47494638')) return 'image/gif';
    return 'image/png';
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/convert', (req, res) => {
    let { data, mode } = req.body;
    if (!data) return res.status(400).json({ error: 'Input data is empty' });

    try {
        let buffer;
        if (mode === 'hex') {
            const cleanHex = data.replace(/^0x/i, '').replace(/[^0-9A-Fa-f]/g, '');
            buffer = Buffer.from(cleanHex, 'hex');
        } else {
            const cleanB64 = data.replace(/^data:image\/\w+;base64,/, "");
            buffer = Buffer.from(cleanB64, 'base64');
        }

        if (buffer.length === 0) throw new Error("Invalid Hex/Base64 data");

        const mime = getMimeType(buffer);
        const ext = mime.split('/')[1];
        const fileName = `img_${Date.now()}.${ext}`;
        
        fs.writeFileSync(path.join(outputDir, fileName), buffer);

        res.json({
            success: true,
            base64: buffer.toString('base64'),
            mime: mime,
            fileName: fileName
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));