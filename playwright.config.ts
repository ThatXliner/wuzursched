import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env.PLAYWRIGHT_PORT ?? 41730);
	const config: PlaywrightTestConfig = {
	testDir: './tests',
	testMatch: '**/*.spec.ts',
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
