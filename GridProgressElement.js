class GridProgressElement extends HTMLElement {
    static observedAttributes = ["value"];

    #connected = false;
    #labelText;
    #valueElement;

    get value() {
        return parseInt(this.getAttribute("value") ?? 0);
    }
    set value(value) {
        const num = parseInt(value);
        this.setAttribute("value", num);
    }

    get max() {
        return parseInt(this.getAttribute("max") ?? 0);
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
    }

    connectedCallback() {
        this.#labelText = this.textContent;

        const shadow = this.attachShadow({ mode: "open" });

        const label = document.createElement("span");
        label.textContent = this.#labelText;

        const progress = document.createElement("span");
        this.#setText(progress);

        shadow.appendChild(label);
        shadow.appendChild(progress);

        this.#valueElement = progress;
        this.#connected = true;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.#connected)
            return;

        switch (name) {
            case "value":
                this.#setText();
                this.#setState();
                break;
            default:
                break;
        }
    }

    #setText(valueElement = null) {
        if (valueElement == null)
            valueElement = this.#valueElement;

        valueElement.textContent = `${this.value}/${this.max}`;
    }

    #setState() {
        if (this.value === this.max)
            this._internals.states.add("complete");
        else
            this._internals.states.delete("complete");
    }
}