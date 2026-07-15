import { readFile } from 'fs';

const readFilePromise = (...args) =>
	new Promise((resolve, reject) => {
		readFile(...args, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});

const stdin = await readFilePromise(process.stdin.fd, 'utf-8');
const REMAP = {
	API_URL: 'PUBLIC_SUPABASE_URL',
	ANON_KEY: 'PUBLIC_SUPABASE_ANON_KEY',
	SERVICE_ROLE_KEY: 'PUBLIC_SUPABASE_SERVICE_ROLE_KEY'
};

let entries;
try {
	entries = Object.entries(JSON.parse(stdin));
} catch {
	entries = [...stdin.matchAll(/(\w+)="(.+)"/gm)].map((match) => [match[1], match[2]]);
}

for (const [key, value] of entries) {
	if (Object.prototype.hasOwnProperty.call(REMAP, key)) {
		console.log(`${REMAP[key]}=${value}`);
	} else {
		console.log(`${key}=${value}`);
	}
}
