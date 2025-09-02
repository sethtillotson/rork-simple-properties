const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8084;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'converter', ts: new Date().toISOString() });
});

app.post('/convert/docx', async (req, res) => {
  console.log('[converter] POST /convert/docx received');
  try {
    const { html, fileName } = req.body;
    
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'html is required' });
    }

    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const htmlFile = path.join(tempDir, `input-${timestamp}.html`);
    const docxFile = path.join(tempDir, `output-${timestamp}.docx`);

    try {
      // Write HTML to temp file
      fs.writeFileSync(htmlFile, html, 'utf8');
      console.log('[converter] HTML written to', htmlFile);

      // Convert using Pandoc
      const pandocCmd = `pandoc "${htmlFile}" -o "${docxFile}" --from html --to docx`;
      console.log('[converter] Running:', pandocCmd);
      
      execSync(pandocCmd, { stdio: 'pipe' });
      console.log('[converter] Pandoc conversion completed');

      // Read the resulting DOCX file
      const docxBuffer = fs.readFileSync(docxFile);
      const base64 = docxBuffer.toString('base64');
      
      const responseFileName = fileName || `document-${timestamp}.docx`;
      
      // Cleanup temp files
      fs.unlinkSync(htmlFile);
      fs.unlinkSync(docxFile);
      
      console.log('[converter] Conversion successful, file size:', docxBuffer.length, 'bytes');
      
      res.json({
        base64,
        filename: responseFileName,
        size: docxBuffer.length
      });

    } catch (conversionError) {
      console.error('[converter] Conversion error:', conversionError);
      
      // Cleanup on error
      try {
        if (fs.existsSync(htmlFile)) fs.unlinkSync(htmlFile);
        if (fs.existsSync(docxFile)) fs.unlinkSync(docxFile);
      } catch (cleanupError) {
        console.error('[converter] Cleanup error:', cleanupError);
      }
      
      res.status(500).json({ 
        error: 'conversion_failed', 
        detail: conversionError.message || 'unknown error' 
      });
    }

  } catch (error) {
    console.error('[converter] Request error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`[converter] listening on ${PORT}`);
  console.log('[converter] Pandoc version:', execSync('pandoc --version', { encoding: 'utf8' }).split('\n')[0]);
});
