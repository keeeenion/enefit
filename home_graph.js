// forward, reverse, still
function _toggleFlow(id, direction = "forward") {
    const el = document.getElementById(id);
    el.classList.remove('flow-forward');
    el.classList.remove('flow-reverse');
    el.classList.add(`flow-${direction}`);
}

function _changeTextValue(id, val) {
    document.getElementById(id).textContent = val;
}

const grid = {
    id: "flow-grid",
    still() { _toggleFlow(this.id, "still") },
    selling() { _toggleFlow(this.id, "reverse") },
    buying() { _toggleFlow(this.id, "forward") },
    value(val) { _changeTextValue("grid-txt", val + " kW") },
    update(val) {
        this.value(val)
        if (val == 0) return this.still();
        if (val > 0) return this.buying();
        if (val < 0) return this.selling();
    }
}

const solar = {
    id: "flow-solar",
    still() { _toggleFlow(this.id, "still") },
    producing() { _toggleFlow(this.id, "forward") },
    value(val) { _changeTextValue("solar-txt", val + " kW") },
    update(val) {
        this.value(val)
        if (val == 0) return this.still();
        if (val > 0) return this.producing();
    }
}

const home = {
    id: "flow-home",
    still() { _toggleFlow(this.id, "still") },
    usage() { _toggleFlow(this.id, "reverse") },
    value(val) { _changeTextValue("load-txt", val + " kW") },
    update(val) {
        this.value(val)
        if (val == 0) return this.still();
        if (val > 0) return this.usage();
    }
}

const battery = {
    id: "flow-battery",
    still() { _toggleFlow(this.id, "still") },
    providing() { _toggleFlow(this.id, "forward") },
    storing() { _toggleFlow(this.id, "reverse") },
    value(val) {
        _changeTextValue("battery-txt", val + ` / ${maxBatteryCapacity} kWh`)
        _changeTextValue("battery-cap-txt", Math.floor(val * 100 / maxBatteryCapacity).toFixed(0) + "%")
    },
    update(val) {
        if (val == 0) return this.still();
        if (val > 0) return this.storing();
        if (val < 0) return this.providing();
    }
}

function flowDefaults() {
    grid.still();
    grid.value(0);    
    solar.still();
    solar.value(0);
    home.still();
    home.value(0);
    battery.still();
    battery.value(0);
}