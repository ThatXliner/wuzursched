import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const config: PlaywrightTestConfig = {
	testMatch: '**/*.spec.ts',
	webServer: {
		command: `pnpm run build && pnpm run preview --port ${port}`,
		port,
		reuseExistingServer: !process.env.CI
	}
};

export default config;
