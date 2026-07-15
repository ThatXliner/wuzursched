import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
const config: PlaywrightTestConfig = {
	testDir: './tests',
	fullyParallel: false,
	workers: 1,
	use: {
		baseURL: 'http://localhost:4174',
		trace: 'retain-on-failure'
	},
	webServer: {
		command: 'pnpm run build && pnpm exec vite preview --port 4174',
		url: 'http://localhost:4174',
		reuseExistingServer: false
	}
};

export default config;
