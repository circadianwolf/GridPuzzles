class GridPuzzle {
    //#region Private Variables

    #id;
    #title;
    #instructions;
    /** @type {Map<string, ProgressTrack>} */
    #progressTracks = new Map();
    #successEvent = new EventManager('SuccessChanged');
    #gridType;
    #gridRows;
    #gridArgs;

    #complete = false;

    //#endregion

    //#region Properties

    get Id() {
        return this.#id;
    }
    get Title() {
        return this.#title;
    }
    get Instructions() {
        return this.#instructions;
    }
    get ProgressTracks() {
        return this.#progressTracks;
    }
    get GridType() {
        return this.#gridType;
    }
    get GridRows() {
        return this.#gridRows;
    }
    get GridArgs() {
        return this.#gridArgs;
    }

    get SuccessEvent() {
        return this.#successEvent;
    }

    //#endregion

    /**
        @param id {string}
        @param title {string}
        @param instructions {string}
        @param progressTracks {ProgressTrack[]}
        @param gridType {any} A class type that inherits from GridBase.
        @param gridRows {any[][]}
        @param gridArgs {any[]} Arguments that will be passed to the grid constructor after the default GridBase arguments.
    */
    constructor(id, title, instructions, progressTracks, gridType, gridRows, gridArgs) {
        if (typeof gridType !== "function"
            || !('prototype' in gridType)
            || !(gridType.prototype instanceof GridBase))
            throw "Invalid grid type";

        this.#id = id;
        this.#title = title;
        this.#instructions = instructions;
        this.#progressTracks = new Map(Array.from(progressTracks, (v) => [v.Name, v]));
        this.#gridType = gridType;
        this.#gridRows = gridRows;
        this.#gridArgs = gridArgs ?? [];
    }

    SetProgress(name, value) {
        const progressElement = this.#GetProgressElement(name);

        const num = parseInt(value);
        if (num === NaN)
            throw "Invalid progress value: " + value;

        progressElement.value = num;

        this.#UpdateProgress();
    }

    #GetProgressElement(name) {
        if (!this.#progressTracks.has(name))
            throw "Invalid progress track: " + name;
        const id = this.#progressTracks.get(name).ElementId;
        /** @type {GridProgressElement} */
        const progressElement = document.getElementById(id);
        if (progressElement == null || !(progressElement instanceof GridProgressElement))
            throw "Invalid progress track: " + name;
        return progressElement;
    }

    #UpdateProgress() {
        const incomplete = [...this.#progressTracks.keys()].some(name => {
            const el = this.#GetProgressElement(name);
            return el.value < el.max;
        });
        if (!incomplete && !this.#complete) {
            this.#complete = true;
            this.#successEvent.Call(true);
        }
        else if (incomplete && this.#complete) {
            this.#complete = false;
            this.#successEvent.Call(false);
        }
    }
}

class ProgressTrack {
    Name;
    Display;
    MaxValue;
    ElementId;

    constructor(name, display, maxValue) {
        this.Name = name;
        this.Display = display;
        this.MaxValue = maxValue;
    }
}