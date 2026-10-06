// Transport adapter: keep the skill CLI unchanged while routing Azure via Portkey.
import http from 'node:http';

const upstream = process.env.IMAGE_GATEWAY_URL || 'https://portkey.syngenta.com/v1/';
const provider = process.env.IMAGE_GATEWAY_PROVIDER || 'openai-aifoundry-swc-001';
if (!process.env.OPENAI_API_KEY) throw new Error('Configure the gateway credential locally.');
const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const original = Buffer.concat(chunks);
    // Model field is ASCII in either the JSON body or multipart form data.
    const contentType = req.headers['content-type'] || '';
    const body = contentType.includes('application/json')
      ? Buffer.from(JSON.stringify({ ...JSON.parse(original.toString('utf8')), model: `@${provider}/gpt-image-2` }))
      : Buffer.from(original.toString('latin1').replace(/(name="model"\r\n\r\n)gpt-image-2(?=\r\n)/, `$1@${provider}/gpt-image-2`), 'latin1');
    const response = await fetch(new URL(req.url.replace(/^\/v1\//, ''), upstream), {
      method: req.method,
      headers: { 'content-type': req.headers['content-type'], authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'x-portkey-api-key': process.env.OPENAI_API_KEY },
      body,
      signal: AbortSignal.timeout(600000),
    });
    res.writeHead(response.status, { 'content-type': response.headers.get('content-type') || 'application/json' });
    for await (const chunk of response.body) res.write(chunk);
    res.end();
  } catch {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Image gateway transport failed; check routing and connectivity.' } }));
  }
});
server.listen(9235, '127.0.0.1', () => console.log('Image gateway adapter listening on 127.0.0.1:9235'));
