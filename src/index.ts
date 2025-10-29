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

	/**
	 * If undefined, will show the name of the script filename instead.
	 */
	prefix: string | undefined

	color: ChalkInstance | undefined
	errorColor: ChalkInstance | undefined
}

export function isDev() {
	if (
		// @ts-ignore
		typeof process !== 'undefined' &&
		// @ts-ignore
		process.env?.NODE_ENV.startsWith('dev')
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
		if (process.env.NODE_ENV.startsWith('dev')) {
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
			prefix: undefined,
			...options,
		}
	}

	get shouldLog() {
		return this.#options.alwaysLog
	}
	set shouldLog(value: boolean) {
		this.#options.alwaysLog = value
	}

	#shouldLog(options?: {
		alwaysLog?: boolean
		logIfDevelopment?: boolean
	}): boolean {
		options ??= {}
		if ((options?.alwaysLog ?? this.#options.alwaysLog) === true) {
			return true
		}

		if (
			(options?.logIfDevelopment ?? this.#options.logIfDevelopment) === false
		) {
			return false
		}

		return isDev()
	}

	get prefix() {
		return this.#options.prefix
			? `[${this.#options.prefix}] `
			: this.#getFilePrefix()
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
				const file = parts[parts.length - 1] as string
				return `[${file.toUpperCase()}] `
			}
		}

		return ''
	}

	log(value: any, options?: Partial<LoggerOptions>) {
		if (!this.#shouldLog(options)) return
		const prefix = options?.prefix ? `[${options.prefix}] ` : this.prefix
		const msg =
			prefix + (typeof value === 'object' ? JSON.stringify(value) : value)
		const color = options?.color ?? this.#options.color
		if (color) {
			console.log(color(msg))
		} else {
			console.log(msg)
		}
	}
	error(value: any, options?: Partial<LoggerOptions>) {
		if (!this.#shouldLog(options)) return
		const prefix = options?.prefix ? `[${options.prefix}] ` : this.prefix
		const msg =
			prefix + (typeof value === 'object' ? JSON.stringify(value) : value)

		const color = options?.color ?? this.#options.color
		if (color) {
			console.error(color(msg))
		} else {
			console.error(msg)
		}
	}
}
