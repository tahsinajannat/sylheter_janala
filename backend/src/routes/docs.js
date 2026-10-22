import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import swaggerUiDist from 'swagger-ui-dist';
import YAML from 'yaml';

const router = Router();
const here = dirname(fileURLToPath(import.meta.url));
const yamlText = readFileSync(join(here, '../docs/openapi.yaml'), 'utf8');
const spec = YAML.parse(yamlText);

// Swagger UI static assets (served from node_modules, no CDN)
router.use('/assets', express.static(swaggerUiDist.getAbsoluteFSPath(), { index: false }));

router.get('/openapi.json', (_req, res) => res.json(spec));
router.get('/openapi.yaml', (_req, res) => res.type('text/yaml').send(yamlText));

// Helmet's CSP forbids inline scripts, so the init code is its own file.
router.get('/init.js', (req, res) => {
  res.type('application/javascript').send(`window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: ${JSON.stringify(`${req.baseUrl}/openapi.json`)},
    dom_id: '#swagger-ui',
    deepLinking: true,
    persistAuthorization: true,
    displayRequestDuration: true,
    tagsSorter: 'alpha',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout'
  });
};`);
});

router.get('/', (req, res) => {
  const a = `${req.baseUrl}/assets`;
  res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sylheter Janala API</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${a}/swagger-ui.css"></head>
<body><div id="swagger-ui"></div>
<script src="${a}/swagger-ui-bundle.js"></script>
<script src="${a}/swagger-ui-standalone-preset.js"></script>
<script src="${req.baseUrl}/init.js"></script></body></html>`);
});

export default router;
