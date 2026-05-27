const https = require('https');

const GS_URL = 'https://script.google.com/macros/s/AKfycbxKKrJYLCzarXPpa86RWAnE75r683HuqEUxEkYe63IvqyGt0e3cklVGUpmjCL9_3r27/exec';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Follow redirect if needed
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          httpsGet(res.headers.location).then(resolve).catch(reject);
        } else {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  try {
    let gsUrl;

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const encoded = encodeURIComponent(JSON.stringify(body.data || {}));
      gsUrl = `${GS_URL}?action=write&data=${encoded}&t=${Date.now()}`;
    } else {
      gsUrl = `${GS_URL}?action=read&t=${Date.now()}`;
    }

    const text = await httpsGet(gsUrl);

    let parsed;
    try { parsed = JSON.parse(text); }
    catch(e) { parsed = {}; }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
