export interface ChalkInstance {
	(...text: unknown[]): string
}

interface LoggerOptions {
	/**
	 * If false, will log only in development environments (unless logIfDevelopment is false too).
	 * Set this property to true if you want to log everywhere (production included)
	 *
	 * @default false
	 */
	alwaysLog: boolean

	/**
	 * Log if development environment is detected.
	 *
	 * @default true
	 */
	logIfDevelopment: boolean

	/**
	 * @default true
	 */
	showFilePrefix: boolean

	color: ChalkInstance | undefined
	errorColor: ChalkInstance | undefined
}

export function isDev() {
	if (
		// @ts-ignore
		typeof process !== 'undefined' &&
		// @ts-ignore
		process.env?.NODE_ENV === 'development'
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
		if (process.env.NODE_ENV === 'development') {
			return true
		}
	} catch {
		// ignore if not supported
	}
	try {
		// import.meta.env.DEV is directly replaced by vite
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

	constructor(options?: Partial<LoggerOptions>) {
		this.#options = {
			alwaysLog: false,
			logIfDevelopment: true,
			showFilePrefix: true,
			color: undefined,
			errorColor: undefined,
			...options,
		}
	}

	get shouldLog() {
		return this.#options.alwaysLog
	}
	set shouldLog(value: boolean) {
		this.#options.alwaysLog = value
	}

	#shouldLog() {
		if (this.#options.alwaysLog === true) {
			return true
		}

		if (this.#options.logIfDevelopment === false) {
			return false
		}

		return isDev()
	}

	#getFilePrefix(): string {
		if (!this.#options.showFilePrefix) return ''

		try {
			// @ts-ignore
			thisDoesNotExist() // intentionally fail to get stack
		} catch (err: any) {
			// console.log(err.stack)
			if (!err.stack) return ''

			const lines = err.stack.split('\n')
			// third line is usually the caller of Logger.log
			const callerLine = lines[3] || lines[2] || lines[1] || ''

			// extract filename from path, works for file:/// or /absolute/path
			const match = callerLine.match(/([\/\\]?[\w\-]+)\.(ts|js)/)
			if (match) {
				// get basename without extension
				const parts = match[1].split(/[\/\\]/)
				const file = parts[parts.length - 1]
				return `[${file}] `
			}
		}

		return ''
	}

	log(value: any) {
		if (!this.#shouldLog()) return
		const prefix = this.#getFilePrefix()
		const msg =
			prefix + (typeof value === 'object' ? JSON.stringify(value) : value)
		if (this.#options.color) {
			console.log(this.#options.color(msg))
		} else {
			console.log(msg)
		}
	}
	error(value: any) {
		if (!this.#shouldLog()) return
		const prefix = this.#getFilePrefix()
		const msg =
			prefix + (typeof value === 'object' ? JSON.stringify(value) : value)
		if (this.#options.errorColor) {
			console.error(this.#options.errorColor(msg))
		} else {
			console.error(msg)
		}
	}
}
