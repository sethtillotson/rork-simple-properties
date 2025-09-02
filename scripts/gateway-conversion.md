# Gateway DOCX conversion endpoint

Implement a small Node/Express endpoint that converts HTML to DOCX using Pandoc or LibreOffice. Expose as POST /convert/docx.

## Example (Node + Pandoc)

- Requirements on server node (Jetson or master):
  - pandoc

Install pandoc (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install -y pandoc
```

server.js (snippet):

```js
app.post('/convert/docx', async (req, res) => {
  try {
    const { html, fileName } = req.body || {};
    if (!html || typeof html !== 'string') return res.status(400).json({ error: 'missing html' });
    const name = fileName || `document-${Date.now()}.docx`;
    const tmpHtml = `/tmp/input-${Date.now()}.html`;
    const tmpDocx = `/tmp/output-${Date.now()}.docx`;
    await fs.promises.writeFile(tmpHtml, html, 'utf8');
    // Convert HTML -> DOCX
    await execFile('pandoc', ['-f', 'html', '-t', 'docx', '-o', tmpDocx, tmpHtml]);
    const b64 = await fs.promises.readFile(tmpDocx, { encoding: 'base64' });
    res.json({ base64: b64, filename: name });
  } catch (e) {
    console.error('convert/docx error', e);
    res.status(500).json({ error: 'conversion_failed' });
  } finally {
    // cleanup best-effort
    try { fs.unlinkSync(tmpHtml); } catch {}
    try { fs.unlinkSync(tmpDocx); } catch {}
  }
});
```

- Run the gateway as before; expose /convert/docx along with /ai/generate.
- Ensure CORS allows the app origin.

## Alternative: LibreOffice headless

```bash
sudo apt-get install -y libreoffice
soffice --headless --convert-to docx input.html --outdir /tmp
```

Pandoc tends to preserve structure more faithfully from HTML.
