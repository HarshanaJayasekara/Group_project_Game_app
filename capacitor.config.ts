import { CapacitorConfig } from '@capacitor/cli'

let config: CapacitorConfig

const baseConfig: CapacitorConfig = {
	appId: 'net.codinghermit.snl',
	appName: 'game',
	webDir: 'build',
	// plugins: {
	// 	CapacitorHttp: {
	// 		enabled: true,
	// 	},
	server: {
		// hostname: 'snakes-and-ladders.codinghermit.net',
		url: 'http://192.168.8.133:5173',
		cleartext: true,
	},
}

const prodConfig = { ...baseConfig, server: { url: 'https://snakes-and-ladders.codinghermit.net', cleartext: true } }
switch (process.env.NODE_ENV) {
	case 'prod':
		// delete prodConfig.server // Delete the 'server' property
		config = prodConfig
		break
	default:
		config = baseConfig
		break
}

export default config
