class EventManager extends EventTarget {
    #eventName;
    #listeners = new IterableWeakMap();

    get EventName() {
        return this.#eventName;
    }

    constructor(eventName) {
        super();

        this.#eventName = eventName;

        this.addEventListener(this.#eventName, (e) => {
            //we convert to a new map here so that the list is static for this call
            //i.e., any event listeners added by the listener calls themselves will not be called by the same call that created them
            //in particular, this avoids loops using dataContext.SetAlias, where elements bound to an alias would be disconnected and reconnected by the alias change,
            //  creating a new listener that would be called again by the for of loop, which created another new listener, etc.
            const currentListeners = new Set(this.#listeners.values());
            for (const listener of currentListeners) {
                let callListener = true;
                if (listener.detailFilter)
                    callListener = listener.detailFilter(e.detail);
                if (callListener)
                    listener.listener(e.detail);
            }
        });
    }

    AddListener(listeningObject, listener, detailFilter = null, abortSignal = null) {
        this.#listeners.set(listeningObject, { listener, detailFilter });

        if (abortSignal)
            EventManager.#AttachAbortSignalHandler(abortSignal, new WeakRef(listeningObject), this);
    }

    static #AttachAbortSignalHandler(abortSignal, listeningObjectRef, eventManager) {
        abortSignal.addEventListener("abort", function () {
            const listeningObject = listeningObjectRef.deref();
            if (listeningObject && eventManager.has(listeningObject))
                eventManager.RemoveListener(listeningObject);
        }, { once: true });
    }

    RemoveListener(listeningObject) {
        this.#listeners.delete(listeningObject);
    }

    HasListeners() {
        return this.#listeners.size > 0;
    }

    HasListener(listeningObject) {
        return this.#listeners.has(listeningObject);
    }

    Call(detail) {
        if (this.#listeners.size)
            this.dispatchEvent(new CustomEvent(this.#eventName, { detail: detail }));
    }
}