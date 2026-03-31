class GridPuzzle {
    //#region Private Variables

    #id;
    #title;
    #instructions;
    /** @type {ProgressTrack[]} */
    #progressTracks = [];
    #gridType;

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

    //#endregion

    /**
        @param id {string}
        @param title {string}
        @param instructions {string}
        @param progressTracks {ProgressTrack[]}
        @param gridType {any} A class type that inherits from GridBase.
    */
    constructor(id, title, instructions, progressTracks, gridType) {
        if (typeof gridType !== "function"
            || !('prototype' in gridType)
            || !(gridType.prototype instanceof GridBase))
            throw "Invalid grid type";

        this.#id = id;
        this.#title = title;
        this.#instructions = instructions;
        this.#progressTracks = progressTracks;
        this.#gridType = gridType;
    }

    CreateGrid(canvasId, leftX, topY) {
        return new this.GridType.prototype.constructor(canvasId, leftX, topY, this.ProgressTracks);
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