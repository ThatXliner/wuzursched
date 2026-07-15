import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4174);
const config: PlaywrightTestConfig = {
	testDir: './tests',
	fullyParallel: false,
	workers: 1,
	use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
	webServer: {
		command: `pnpm run build && pnpm run preview --port ${port}`,
		port,
		reuseExistingServer: false
	}
};

export default config;
