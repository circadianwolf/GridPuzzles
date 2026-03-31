class HitoriGrid extends GridBase {
    static #puzzleInfo;

    static #cells = [
        [1, 2, 7, 8, 1, 6, 8, 5],
        [6, 5, 8, 4, 2, 7, 2, 2],
        [4, 6, 3, 6, 8, 6, 5, 7],
        [5, 1, 8, 7, 4, 8, 4, 3],
        [8, 4, 6, 2, 5, 6, 3, 1],
        [5, 8, 1, 5, 2, 3, 2, 4],
        [2, 3, 4, 8, 4, 6, 7, 1],
        [5, 7, 8, 5, 2, 1, 6, 1]
    ];

    static GetPuzzle() {
        if (this.#puzzleInfo == null) {
            const instructions = `Shade some squares so that no number epeats in any row or column.
Shaded squares cannot touch, except diagonally.
All unshaded squares must form a single connected region.

<br/><br/>Click a square to shade it.
<br/>Clicking again will shade it darker (identical function, visual only).
<br/>Click again to remove shading.`;

            const progressTracks = [
                new ProgressTrack(this.RowProgress, 'Rows', 8),
                new ProgressTrack(this.ColProgress, 'Columns', 8),
                new ProgressTrack(this.NoShadedTouchProgress, 'No Shaded Squares Touch', 1),
                new ProgressTrack(this.UnshadedRegionProgress, 'One Unshaded Region', 1)
            ];

            this.#puzzleInfo = new GridPuzzle('HitoriGrid', 'Hitori', instructions, progressTracks, HitoriGrid);
        }

        return this.#puzzleInfo;
    }

    static get RowProgress() { return "Rows"; }
    static get ColProgress() { return "Columns"; }
    static get NoShadedTouchProgress() { return "NoShadedTouch"; }
    static get UnshadedRegionProgress() { return "UnshadedRegion"; }

    Rows = [];
    Cols = [];

    constructor(canvasId, leftX, topY) {
        super(canvasId, leftX, topY, 44, HitoriGrid.#cells, HitoriGrid.#puzzleInfo.ProgressTracks);

        for (let i = 0; i < this.RowCount; i++)
            this.Rows[i] = false;
        for (let i = 0; i < this.ColCount; i++)
            this.Cols[i] = false;
    }

    //#region Overrides

    LoadCell(rowIdx, colIdx, value) {
        const cell = super.LoadCell(rowIdx, colIdx, value);
        cell.Value = new HitoriCellValue(value);
    }

    /** @param cell {Cell} */
    CellClick(cell) {
        if (!cell.Value.Shaded)
            cell.Value.Shaded = true;
        else if (!cell.Value.Locked)
            cell.Value.Locked = true;
        else
            cell.Value.Shaded = cell.Value.Locked = false;

        this.Rows[cell.Row] = this.#GetLineValidity(this.CellGrid[cell.Row]);

        const colCells = [];
        for (const row of this.CellGrid)
            colCells.push(row[cell.Col]);
        this.Cols[cell.Col] = this.#GetLineValidity(colCells);
    }

    DrawGrid() {
        this.#UpdateProgress();

        //we don't use super.DrawGrid() but instead call the functions directly because we want to draw the grid lines and cell borders after filling the cells in #DrawCells()
        this.ClearGrid();
        this.#DrawCells();
        this.DrawGridLines();
        this.DrawCellBorders();
    }

    //#endregion

    #DrawCells() {
        for (const cell of this.CellList) {
            if (cell.Value.Shaded) {
                this.SetFillStyle(cell.Value.Locked ? '#555' : '#AAA');
                this.FillGridCell(cell.Row, cell.Col);
            }

            this.SetTextStyle();
            this.DrawCellText(cell.Value.Value, cell.Row, cell.Col, 14, -12);
        }
    }

    #GetLineValidity(cells) {
        let valid = true;
        const values = new Set();
        for (const cell of cells) {
            if (!cell.Value.Shaded) {
                if (values.has(cell.Value.Value)) {
                    valid = false;
                    break;
                }
                else
                    values.add(cell.Value.Value);
            }
        }
        return valid;
    }

    #UpdateProgress() {
        this.SetProgress(HitoriGrid.RowProgress, this.Rows.filter(x => x).length);
        this.SetProgress(HitoriGrid.ColProgress, this.Cols.filter(x => x).length);

        let shadeCount = 0;
        let shadeValid = true;
        let firstUnshaded = null;
        for (const cell of this.CellList) {
            if (cell.Value.Shaded) {
                shadeCount++;
                if (shadeValid
                    && ((cell.Col > 0 && this.CellGrid[cell.Row][cell.Col - 1].Value.Shaded)
                        || (cell.Col < this.ColCount - 1 && this.CellGrid[cell.Row][cell.Col + 1].Value.Shaded)
                        || (cell.Row > 0 && this.CellGrid[cell.Row - 1][cell.Col].Value.Shaded)
                        || (cell.Row < this.RowCount - 1 && this.CellGrid[cell.Row + 1][cell.Col].Value.Shaded))) {
                    shadeValid = false;
                }
            }
            else if (firstUnshaded == null)
                firstUnshaded = cell;
        }
        this.SetProgress(HitoriGrid.NoShadedTouchProgress, shadeValid ? 1 : 0);

        let unshadedValid = firstUnshaded != null;

        if (unshadedValid) {
            let unshadedCount = 0;
            const regionCheck = [];
            for (let y = 0; y < this.RowCount; y++) {
                regionCheck[y] = [];
                for (let x = 0; x < this.ColCount; x++)
                    regionCheck[y][x] = false;
            }

            const checkRegionCell = (row, col) => {
                if (row < 0 || row > this.RowCount - 1 || col < 0 || col > this.ColCount - 1)
                    return;
                if (regionCheck[row][col])
                    return;

                const cell = this.CellGrid[row][col];
                if (cell.Value.Shaded)
                    return;

                unshadedCount++;
                regionCheck[row][col] = true;

                checkRegionCell(row + 1, col);
                checkRegionCell(row - 1, col);
                checkRegionCell(row, col + 1);
                checkRegionCell(row, col - 1);
            };

            checkRegionCell(firstUnshaded.Row, firstUnshaded.Col);

            if (unshadedCount + shadeCount < this.CellList.length)
                unshadedValid = false;
        }
        this.SetProgress(HitoriGrid.UnshadedRegionProgress, unshadedValid ? 1 : 0);
    }
}

class HitoriCellValue {
    Value = 0;
    Shaded = false;
    Locked = false;

    constructor(value) {
        this.Value = value;
    }
}