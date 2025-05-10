const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const ImageTracer = require('imagetracerjs');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const port = 3000;

const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(outputDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

app.use(express.static('public'));

app.post('/convert', upload.array('images', 10), async (req, res) => {
  const results = [];

  for (let file of req.files) {
    const inputPath = file.path;
    const outputFileName = path.basename(file.originalname, '.png') + '.svg';
    const outputPath = path.join(outputDir, outputFileName);

    try {
      const image = await loadImage(inputPath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      const svgString = ImageTracer.imagedataToSVG(imageData);
      fs.writeFileSync(outputPath, svgString);

      results.push({ original: file.originalname, svg: `/download/${outputFileName}` });
    } catch (error) {
      results.push({ original: file.originalname, error: 'Conversion failed' });
    }
  }

  res.json(results);
});

app.use('/download', express.static(outputDir));

app.listen(port, () => {
  console.log(`PNG to SVG converter running on http://localhost:${port}`);
});
