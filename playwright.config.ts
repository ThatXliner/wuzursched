import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
const config: PlaywrightTestConfig = {
	webServer: {
		command: 'pnpm run build && pnpm exec vite preview --port 41730',
		port: 41730,
		reuseExistingServer: !process.env.CI
	}
};

export default config;
