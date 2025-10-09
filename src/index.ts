let _DEBUG: boolean | undefined

export function DEBUG(value: boolean | string) {
	if (typeof value === 'boolean') {
		_DEBUG = value
		return
	}

	if (typeof value === 'string') {
		// explicit debug on
		if (_DEBUG === true) {
			console.log(value)
			return
		}

		// Node.js check
		if (
			typeof process !== 'undefined' &&
			process.env?.NODE_ENV === 'development'
		) {
			console.log(value)
			return
		}

		// Vite/browser check
		try {
			// import.meta is only valid in ESM; this will throw in CJS
			if ((import.meta as any)?.env?.DEV) {
				console.log(value)
				return
			}
		} catch {
			// ignore if not supported
		}
	}
}
