class IterableWeakMap {
    #weakMap = new WeakMap();
    #iterableMap = new Map();
    #refMap = new WeakMap();

    get size() {
        return this.#iterableMap.size;
    }

    set(key, value) {
        if (!this.#weakMap.has(key)) {
            const symbol = Symbol();
            this.#iterableMap.set(symbol, new WeakRef(key));
            this.#refMap.set(key, symbol);
        }

        this.#weakMap.set(key, value);

        return this;
    }

    has(key) {
        return this.#weakMap.has(key);
    }

    get(key) {
        return this.#weakMap.get(key);
    }

    delete(key) {
        if (this.#refMap.has(key)) {
            const symbol = this.#refMap.get(key);
            this.#refMap.delete(key);
            this.#weakMap.delete(key);
            this.#iterableMap.delete(symbol);
        }
    }

    keys() {
        const keys = [];

        const currentSymbols = Array.from(this.#iterableMap.keys());
        for (const symbol of currentSymbols) {
            const keyRef = this.#iterableMap.get(symbol);
            const key = keyRef.deref();
            if (key != null)
                keys.push(key);
            else
                this.#iterableMap.delete(symbol);
        }

        return keys;
    }

    values() {
        return this.keys().map(x => this.#weakMap.get(x));
    }

    entries() {
        return this.keys().map(x => [x, this.#weakMap.get(x)]);
    }

    clear() {
        const currentSymbols = Array.from(this.#iterableMap.keys());
        for (const symbol of currentSymbols) {
            const keyRef = this.#iterableMap.get(symbol);
            const key = keyRef.deref();
            if (key !== null) {
                this.#weakMap.delete(key);
                this.#refMap.delete(key);
            }
            this.#iterableMap.delete(symbol);
        }
    }

    forEach(callbackFn) {
        for (const key of this.keys()) {
            callbackFn(this.get(key), key, this);
        }
    }

    [Symbol.iterator]() {
        return this.entries();
    }
}