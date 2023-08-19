import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
console.log(process.env.VITE_SUPABASE_URL);
const config: PlaywrightTestConfig = {
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 4173
	}
};

export default config;
