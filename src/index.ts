import chalk, {ChalkInstance} from 'chalk'

// export interface ChalkInstance {
// 	(...text: unknown[]): string
// }

interface LogOptions {
	// color: ChalkInstance | undefined

	/**
	 * By default, only log in development mode.
	 * Set to true to always log.
	 *
	 * @default false
	 */
	force: boolean
}

type LogMethod = 'log' | 'error' | 'warn' | 'debug'
type ColorMap = Record<LogMethod, ChalkInstance | undefined>

interface LoggerOptions extends LogOptions {
	/**
	 * If undefined, will show the name of the script filename instead (if `showFilePrefix` is set to true)
	 */
	prefix: string | undefined

	/**
	 * This is overridden by `prefix`.
	 * If `prefix` is not set and this is set to false, no prefix will be shown.
	 *
	 * @default true
	 */
	showFilePrefix: boolean

	/**
	 * When true, will show all debug logs (from `.debug()` calls).
	 * Can be useful to disable debug logs in production.
	 *
	 * @default true
	 */
	debug: boolean

	colors: Partial<ColorMap>
}

export function isDev() {
	if (
		// @ts-ignore
		typeof process !== 'undefined' &&
		// @ts-ignore
		process?.env?.NODE_ENV?.startsWith('dev')
	) {
		return true
	}
	try {
		// import.meta is only valid in ESM; this will throw in CJS
		if ((import.meta as any)?.env?.DEV) {
			return true
		}
	} catch {
		// ignore if not supported
	}
	try {
		// process.env.NODE_ENV is directly replaced by vite
		// @ts-ignore
		if (process?.env?.NODE_ENV?.startsWith('dev')) {
			return true
		}
	} catch {
		// ignore if not supported
	}
	try {
		// import.meta.env.DEV is directly replaced by vite
		// @ts-ignore
		if (import.meta.env.DEV === true) {
			return true
		}
	} catch {
		// ignore if not supported
	}

	return false
}

export class Logger {
	#options: LoggerOptions
	#forceMethod = false

	constructor(options?: Partial<LoggerOptions>) {
		this.#options = {
			force: false,
			debug: true,
			showFilePrefix: true,
			colors: {},
			prefix: undefined,
			...options,
		}
		this.#options.colors = {
			error: chalk.red,
			...options?.colors,
		}
	}

	#shouldLog(): boolean {
		return isDev() || this.#options.force
	}

	get prefix() {
		return this.#options.prefix
			? `[${this.#options.prefix}] `
			: this.#options.showFilePrefix
				? this.#getFilePrefix()
				: ''
	}

	#getFilePrefix(): string {
		if (!this.#options.showFilePrefix) return ''

		try {
			// @ts-ignore
			thisDoesNotExist() // intentionally fail to get the stack
		} catch (err: any) {
			// console.log(err.stack)
			if (!err.stack) return ''

			const lines = err.stack.split('\n')
			// third line is usually the caller of Logger.log
			const callerLine =
				(this.#forceMethod && lines[6]) ||
				lines[5] ||
				lines[4] ||
				lines[3] ||
				lines[2] ||
				lines[1] ||
				''

			// extract filename from path, works for file:/// or /absolute/path
			const match = callerLine.match(/([\/\\]?[\w\-]+)\.(ts|js)/)
			if (match) {
				// get basename without extension
				const parts = match[1].split(/[\/\\]/)
				const file = parts[parts.length - 1] as string
				return `[${file.toUpperCase()}]`
			}
		}

		return ''
	}

	#log(method: LogMethod | 'plain', data: any[]) {
		if (!this.#shouldLog()) return

		const logFn = method === 'plain' ? console.log : console[method]
		const color = method === 'plain' ? undefined : this.#options.colors[method]

		const parts = [
			this.prefix,
			...data.map((x) =>
				typeof x === 'object' && x !== null ? JSON.stringify(x) : x,
			),
		]
		const output = color ? parts.map((x) => color(x)) : parts

		logFn(...output)
	}

	log(...data: any[]) {
		this.#log('log', data)
	}

	error(...data: any[]) {
		this.#log('error', data)
	}

	warn(...data: any[]) {
		// TODO: add warn color
		this.#log('warn', data)
	}

	debug(...data: any[]) {
		if (this.#options.debug) {
			this.#log('debug', ['[DEBUG]', ...data])
		}
	}

	plain(...data: any[]) {
		this.#log('plain', data)
	}

	force(method: LogMethod, ...data: []) {
		this.#forceMethod = true
		const wasForced = this.#options.force === true
		const wasDebug = this.#options.debug === true
		this.#options.force = true
		this.#options.debug = true
		this[method](...data)
		if (!wasForced) {
			this.#options.force = false
		}
		if (!wasDebug) {
			this.#options.debug = false
		}
		this.#forceMethod = false
	}
}
