import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env.PLAYWRIGHT_PORT ?? 41730);
const config: PlaywrightTestConfig = {
	testDir: './tests',
	webServer: {
		command: `pnpm run build && pnpm run preview --port ${port}`,
		port,
		reuseExistingServer: !process.env.CI
	},
	use: { baseURL: `http://localhost:${port}` }
};

export default config;
