class GridBase {
    //#region Private Variables

    #canvasId;
    #canvas;
    #canvasContext;
    #leftX;
    #topY;
    #cellSize = 50;
    #cellList = [];
    #cellGrid = [];
    #progressEvent = new EventManager("ProgressChanged");

    //#endregion

    //#region Properties

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
    /** @type {CanvasRenderingContext2D} */
    get CanvasContext() {
        if (!this.#canvasContext) {
            this.#canvasContext = this.Canvas.getContext('2d');
        }
        return this.#canvasContext;
    }

    get LeftX() { return this.#leftX; }
    get TopY() { return this.#topY; }
    get CellSize() { return this.#cellSize; }
    get RightX() { return this.LeftX + (this.CellSize * this.ColCount); }
    get BottomY() { return this.TopY + (this.CellSize * this.RowCount); }

    /** @type {Cell[]} */
    get CellList() { return this.#cellList; }
    /** @type {Cell[][]} */
    get CellGrid() { return this.#cellGrid; }
    get RowCount() { return this.CellGrid.length; }
    get ColCount() { return this.RowCount > 0 ? this.CellGrid[0].length : 0; }

    get ProgressChanged() {
        return this.#progressEvent;
    }

    //#endregion

    /**
        @param canvasId {string}
        @param leftX {number}
        @param topY {number}
        @param gridRows {any[][]}
    */
    constructor(canvasId, leftX, topY, cellSize, gridRows) {
        this.#canvasId = canvasId;
        this.#cellSize = cellSize;
        this.#leftX = leftX;
        this.#topY = topY;

        this.LoadCells(gridRows);
        this.LoadGridBorders();
    }

    //#region Initialization

    LoadCells(gridRows) {
        if (gridRows.length === 0)
            throw "No cells in grid";

        const numRows = gridRows.length;
        const numCols = gridRows[0].length;
        if (gridRows.some(row => row.length !== numCols))
            throw "All rows must have equal number of cells";

        //clear existing arrays
        this.CellList.splice(0, this.CellList.length);
        this.CellGrid.splice(0, this.CellGrid.length);

        for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
            const row = [];
            this.CellGrid[rowIdx] = row;

            for (let colIdx = 0; colIdx < numCols; colIdx++) {
                const value = gridRows[rowIdx][colIdx];
                this.LoadCell(rowIdx, colIdx, value);
            }
        }
    }

    LoadCell(rowIdx, colIdx, value) {
        const cell = new Cell(rowIdx, colIdx, value);
        this.CellList.push(cell);
        this.CellGrid[rowIdx][colIdx] = cell;
        return cell;
    }

    LoadGridBorders() {
        for (const cell of this.CellList)
            this.LoadCellBorders(cell);
    }

    /** @param cell {Cell} */
    LoadCellBorders(cell) {
        if (cell.Row === 0)
            cell.Borders.AddBorder(CellBorders.Top);
        else if (cell.Row === this.RowCount - 1)
            cell.Borders.AddBorder(CellBorders.Bottom);

        if (cell.Col === 0)
            cell.Borders.AddBorder(CellBorders.Left);
        else if (cell.Col === this.ColCount - 1)
            cell.Borders.AddBorder(CellBorders.Right);
    }

    //#endregion

    //#region Click Handling

    CanvasClick(clickEvent) {
        const rect = this.Canvas.getBoundingClientRect();
        const mouseX = clickEvent.clientX - rect.left - this.LeftX;
        const mouseY = clickEvent.clientY - rect.top - this.TopY;

        const cellX = Math.floor(mouseX / this.CellSize);
        const cellY = Math.floor(mouseY / this.CellSize);

        if (cellX < 0 || cellX >= this.ColCount
            || cellY < 0 || cellY >= this.RowCount)
            return;

        const cell = this.CellGrid[cellY][cellX];

        this.CellClick(cell);

        this.DrawGrid();
    }

    CellClick(cell) {
        //define in descendant class
    }

    //#endregion

    DrawGrid() {
        this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);

        this.DrawGridLines();
        this.DrawCellBorders();
    }

    //#region Grid Lines

    DrawGridLines() {
        this.SetGridLineStyle();

        //horizontal lines
        for (let y = 0; y <= this.RowCount; y++) {
            this.DrawGridLine(y, 0, y, this.ColCount);
        }
        //vertical lines
        for (let x = 0; x <= this.ColCount; x++) {
            this.DrawGridLine(0, x, this.RowCount, x);
        }
    }

    SetGridLineStyle() {
        this.CanvasContext.setLineDash([]);
        this.CanvasContext.strokeStyle = '#ddd'; //light gray
        this.CanvasContext.lineWidth = 1; //1px thick
    }

    //#endregion

    //#region Cell Borders

    DrawCellBorders() {
        for (const cell of this.CellList) {
            this.SetCellBorderLineStyle(cell);

            if (cell.Borders.HasBorder(CellBorders.Left)) {
                this.DrawGridLine(cell.Row, cell.Col, cell.Row + 1, cell.Col);
            }
            if (cell.Borders.HasBorder(CellBorders.Top)) {
                this.DrawGridLine(cell.Row, cell.Col, cell.Row, cell.Col + 1);
            }
            if (cell.Borders.HasBorder(CellBorders.Right)) {
                this.DrawGridLine(cell.Row, cell.Col + 1, cell.Row + 1, cell.Col + 1);
            }
            if (cell.Borders.HasBorder(CellBorders.Bottom)) {
                this.DrawGridLine(cell.Row + 1, cell.Col, cell.Row + 1, cell.Col + 1);
            }
        }
    }

    SetCellBorderLineStyle(cell) {
        this.CanvasContext.setLineDash([]);
        this.CanvasContext.strokeStyle = '#000'; //black
        this.CanvasContext.lineWidth = 5; //5px thick
    }

    //#endregion

    //#region Helpers

    DrawGridLine(row1, col1, row2, col2, offset = 0) {
        const x1 = this.LeftX + (col1 * this.CellSize) + offset;
        const y1 = this.TopY + (row1 * this.CellSize) + offset;
        const x2 = this.LeftX + (col2 * this.CellSize) + offset;
        const y2 = this.TopY + (row2 * this.CellSize) + offset;

        this.DrawLine(x1, y1, x2, y2);
    }

    DrawLine(x1, y1, x2, y2) {
        this.CanvasContext.beginPath();
        this.CanvasContext.moveTo(x1, y1);
        this.CanvasContext.lineTo(x2, y2);
        this.CanvasContext.stroke();
    }

    FillGridCell(row, col) {
        this.CanvasContext.fillRect(this.LeftX + (col * this.CellSize), this.TopY + (row * this.CellSize), this.CellSize, this.CellSize);
    }

    SetFillStyle(hexColor) {
        this.CanvasContext.fillStyle = hexColor;
    }

    DrawCellText(text, row, col, xOffset = 0, yOffset = 0) {
        //includes offsets for better positioning of text
        let x = this.LeftX + (col * this.CellSize) + (xOffset ?? 0);
        let y = this.TopY + ((row + 1) * this.CellSize) + (yOffset ?? 0);
        this.CanvasContext.fillText(text, x, y);
    }

    SetTextStyle() {
        this.CanvasContext.fillStyle = '#000'; //black
        this.CanvasContext.font = '32px serif'; //font size and family
    }

    SetProgress(name, value) {
        this.#progressEvent.Call(new ProgressChangedEvent(name, value));
    }

    //#endregion
}

class Cell {
    Row = -1;
    Col = -1;
    Value;
    Borders = new CellBorders();

    constructor(row, col, value) {
        this.Row = row;
        this.Col = col;
        this.Value = value;
    }
}

class CellBorders {
    static Left = 1 << 0;
    static Right = 1 << 1;
    static Top = 1 << 2;
    static Bottom = 1 << 3;

    #borders = 0;

    AddBorder(border) {
        this.#borders = this.#borders | border;
    }

    HasBorder(border) {
        return (border & this.#borders) !== 0;
    }
}

class ProgressChangedEvent {
    Name;
    Value;

    constructor(name, value) {
        this.Name = name;
        this.Value = value;
    }
}