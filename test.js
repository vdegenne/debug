import {Logger} from './lib/index.js'
import chalk from 'chalk'

const l = new Logger({
	force: false,
	debug: true,
	colors: {
		log: chalk.yellow,
		debug: chalk.grey,
	},
})

l.log('test', 'adf')
l.error('yooo', '2')
l.debug('haha', 'test', {a: 'adf'})

l.force('debug', chalk.magentaBright('test'))
