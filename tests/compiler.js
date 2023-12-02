console.log('Injecting compiler');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require('path');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { register } = require('ts-node');

register({
	project: join(__dirname, '../tsconfig.json'),
});
console.log('ts-node injected');
