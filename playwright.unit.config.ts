import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	testMatch: ['engineer.spec.ts', 'realtime.spec.ts', 'schedule-order.spec.ts', 'utils.spec.ts']
};

export default config;
