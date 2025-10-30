export interface ChalkInstance {
	(...text: unknown[]): string
}

interface LogOptions {
	color: ChalkInstance | undefined
	/**
	 * By default, only log in development mode.
	 * Set to true to always log.
	 *
	 * @default false
	 */
	force: boolean
}

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

	errorColor: ChalkInstance | undefined
	debugColor: ChalkInstance | undefined
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
			force: false,
			showFilePrefix: true,
			color: undefined,
			errorColor: undefined,
			debugColor: undefined,
			prefix: undefined,
			...options,
		}
	}

	#shouldLog(): boolean {
		return isDev()
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

	#log(
		value: any,
		options?: Partial<LogOptions>,
		logFn: (msg: string) => void = console.log,
	) {
		const o: LogOptions = {
			...this.#options,
			...options,
		}
		if (!o.force && !this.#shouldLog()) return
		const msg =
			this.prefix + (typeof value === 'object' ? JSON.stringify(value) : value)
		if (o.color) {
			logFn(o.color(msg))
		} else {
			logFn(msg)
		}
	}

	log(value: any, options?: Partial<LogOptions>) {
		this.#log(value, options, console.log)
	}

	error(value: any, options?: Partial<LogOptions>) {
		this.#log(
			value,
			{...options, color: this.#options.errorColor || options?.color},
			console.error,
		)
	}

	warn(value: any, options?: Partial<LogOptions>) {
		this.#log(value, options, console.warn)
	}

	debug(value: any, options?: Partial<LogOptions>) {
		this.#log(
			value,
			{...options, color: this.#options.debugColor || options?.color},
			console.debug,
		)
	}

	plain(value: any, options?: Omit<Partial<LogOptions>, 'color'>) {
		this.log(value, {...options, color: undefined})
	}
}
