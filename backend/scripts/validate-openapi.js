import SwaggerParser from '@apidevtools/swagger-parser';

const api = await SwaggerParser.validate(new URL('../src/docs/openapi.yaml', import.meta.url).pathname);
console.log(`OpenAPI OK: ${Object.keys(api.paths).length} paths`);
