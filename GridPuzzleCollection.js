class GridPuzzleCollection {
    static #puzzleListItemClass = "puzzleListItem";

    //#region Private Variables

    #puzzleListId;
    #titleId;
    #instructionsId;
    #progressContainerId;
    #successId;
    #resetButtonId;
    #canvasId;
    #leftX;
    #topY;
    /** @type {Map<string, GridPuzzle>} */
    #puzzles = new Map();

    #canvas;
    #activePuzzle = "";
    /** @type {GridBase} */
    #activeGrid = null;

    //#endregion

    get SuccessElement() {
        return document.getElementById(this.#successId);
    }
    /** @type {HTMLCanvasElement} */
    get Canvas() {
        if (!this.#canvas) {
            const canvas = document.getElementById(this.#canvasId);
            if (!canvas)
                throw "Invalid canvas";
            this.#canvas = canvas;
        }
        return this.#canvas;
    }

    get ActivePuzzle() {
        if (!this.#puzzles.has(this.#activePuzzle))
            return null;
        return this.#puzzles.get(this.#activePuzzle);
    }

    /**
     * @param {string} puzzleListId
     * @param {string} titleId
     * @param {string} instructionsId
     * @param {string} progressContainerId
     * @param {string} successId
     * @param {string} resetButtonId
     * @param {string} canvasId
     * @param {number} leftX
     * @param {number} topY
     * @param {GridPuzzle[]} puzzles
     */
    constructor(puzzleListId, titleId, instructionsId, progressContainerId, successId, resetButtonId, canvasId, leftX, topY, puzzles) {
        this.#puzzleListId = puzzleListId;
        this.#titleId = titleId;
        this.#instructionsId = instructionsId;
        this.#progressContainerId = progressContainerId;
        this.#successId = successId;
        this.#resetButtonId = resetButtonId;
        this.#canvasId = canvasId;
        this.#leftX = leftX;
        this.#topY = topY;
        this.#puzzles = new Map();

        const puzzleList = document.getElementById(puzzleListId);
        puzzleList.addEventListener('click', (e) => {
            if (!e.target.classList.contains(GridPuzzleCollection.#puzzleListItemClass))
                return;

            this.ChangePuzzle(e.target.dataset.id);
        });

        for (const puzzle of puzzles) {
            this.#puzzles.set(puzzle.Id, puzzle);

            const listItem = document.createElement('li');
            listItem.textContent = puzzle.Title;
            listItem.classList.add(GridPuzzleCollection.#puzzleListItemClass);
            listItem.dataset.id = puzzle.Id;
            puzzleList.append(listItem);
        }

        const resetButton = document.getElementById(resetButtonId);
        resetButton.addEventListener('click', (e) => {
            this.ResetPuzzle();
        });

        this.Canvas.addEventListener('click', (e) => {
            this.#activeGrid.CanvasClick(e);
        });
    }

    ChangePuzzle(id) {
        if (this.#activePuzzle === id)
            return;

        const activeItem = this.#GetPuzzleListItem(this.#activePuzzle);
        if (activeItem != null)
            activeItem.classList.remove("active");

        const newItem = this.#GetPuzzleListItem(id);
        newItem.classList.add("active");

        this.#LoadPuzzle(id);
    }

    ResetPuzzle() {
        this.#LoadPuzzle(this.#activePuzzle);
    }

    #GetPuzzleListItem(id) {
        return document.querySelector(`li[data-id='${id}']`);
    }

    #LoadPuzzle(id) {
        if (!this.#puzzles.has(id))
            throw "Invalid puzzle: " + id;

        const puzzle = this.#puzzles.get(id);

        const titleElement = document.getElementById(this.#titleId);
        titleElement.textContent = puzzle.Title;

        const instructionsElement = document.getElementById(this.#instructionsId);
        instructionsElement.innerHTML = puzzle.Instructions;

        const progressContainer = document.getElementById(this.#progressContainerId);
        for (const el of progressContainer.querySelectorAll('grid-progress'))
            el.remove();

        for (const progressTrack of puzzle.ProgressTracks.values()) {
            const progressElement = document.createElement('grid-progress');
            const elementId = "gp" + progressTrack.Name

            progressElement.id = elementId;
            progressElement.setAttribute("max", progressTrack.MaxValue);
            progressElement.textContent = progressTrack.Display;

            progressContainer.append(progressElement);
            progressTrack.ElementId = elementId;
        }

        /** @type {GridBase} */
        const grid = puzzle.CreateGrid(this.#canvasId, this.#leftX, this.#topY);

        grid.SuccessEvent.AddListener(this, (e) => this.UpdateSuccess(e));

        this.#activePuzzle = id;
        this.#activeGrid = grid;

        grid.DrawGrid();
    }

    UpdateSuccess(isComplete = false) {
        if (isComplete)
            this.SuccessElement?.removeAttribute("hidden");
        else
            this.SuccessElement?.setAttribute("hidden", true);
    }
}