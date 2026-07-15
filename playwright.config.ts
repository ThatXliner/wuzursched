import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const config: PlaywrightTestConfig = {
	webServer: {
		command: `pnpm run build && pnpm run preview --port ${port}`,
		port
	},
	use: { baseURL: `http://localhost:${port}` }
};

export default config;
