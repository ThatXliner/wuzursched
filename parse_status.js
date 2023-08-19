//! Example output:
//          API URL: http://localhost:54321
//      GraphQL URL: http://localhost:54321/graphql/v1
//           DB URL: postgresql://postgres:postgres@localhost:54322/postgres
//       Studio URL: http://localhost:54323
//     Inbucket URL: http://localhost:54324
//       JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
//         anon key: <key>
// service_role key: <key>
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
	'API URL': 'VITE_SUPABASE_URL',
	'DB URL': 'DB_URL',
	'anon key': 'VITE_SUPABASE_ANON_KEY',
	'service_role key': 'VITE_SUPABASE_SERVICE_ROLE_KEY'
};
for (let keyValue of stdin.matchAll(/^\s*(.+?):\s+(.+)$/gm)) {
	const key = keyValue[1];
	const value = keyValue[2];
	if (Object.prototype.hasOwnProperty.call(REMAP, key)) {
		console.log(`${REMAP[key]}=${value}`);
	}
}
