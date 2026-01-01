let interval;

const prediction = {
    load: [-0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -3, -3, -2, -2, -2, -2, -2, -1, -1, -1, -4, -5, -5, -5, -5, -4, -1],
    solar: [0, 0, 0, 0, 0, 0, 1, 3, 5, 6, 7, 8, 8, 8, 7, 7, 6, 5, 4, 1, 0, 0, 0, 0],
}
const actual = {
    load: [-1, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -2, -3, -2, -1, -1, -2, -2, -2, -1, -1, -4, -4, -6, -9, -4, -2, -2],
    solar: [0, 0, 0, 0, 0, 0, 1, 3, 5, 6, 7, 8, 8, 8, 7, 7, 6, 5, 4, 1, 0, 0, 0, 0],
    battery_input: [],
    battery_output: [],
}
const powerCost = {
    energy_cost: [0.1836, 0.2113, 0.1803, 0.1586, 0.1317, 0.1771, 0.2476, 0.3448, 0.3942, 0.4184, 0.3776, 0.3599, 0.3233, 0.3120, 0.2972, 0.2680, 0.2678, 0.2996, 0.3647, 0.4554, 0.4737, 0.4257, 0.3791, 0.2431],
    grid_cost: [0.2136, 0.2413, 0.2103, 0.1886, 0.1617, 0.2071, 0.27760, 0.3948, 0.4442, 0.4684, 0.4276, 0.4099, 0.3733, 0.3620, 0.3472, 0.3180, 0.3178, 0.3496, 0.4147, 0.5054, 0.5237, 0.4757, 0.4091, 0.2731],
}

const maxBatteryCapacity = 15;

let state = {
    reset() {
        this.battery = 0;
        this.power_bill = 0;
    },
    battery: 0,
    power_bill: 0
}

const twoDigits = n => String(n).padStart(2, '0');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function start() {
    clearInterval(interval);
    flowDefaults();
    wholeDayPredictions();
    updateTotal();

    await sleep(5000);

    let ticker;

    // 10 seconds per 1 hour
    let day = 1;
    let hour = 0;

    let perDayTimer = 24;
    let decisionTimer = 100;
    const tick = () => {
        // hour finished, grading that hour
        if (decisionTimer <= 0) {
            decisionTimer = 100;
            hourFinished(day, hour);
            perDayTimer--;
        }

        hour = 24 - perDayTimer;

        if (decisionTimer === 100) {
            hour = hour === 24 ? 0 : hour
            hourStarted(day, hour)
        }

        // whole day finished
        if (perDayTimer <= 0) {
            dayFinished(day);
            perDayTimer = 24;
            day++;
        }

        // game over
        if (day >= 8) {
            clearInterval(ticker)
            gameOver();
            return;
        }

        // update decision timer
        _updatePieTimer(decisionTimer);
        _updatePieText(day, `${twoDigits(hour)}:00`);
        decisionTimer -= 10;
    }

    tick();
    // setInterval(tick, 500) // develop only
    ticker = setInterval(tick, 1000) // 10 seconds per hour
}

function gameOver() {

}

function dayFinished(day) {
    clearGraphEntries();
}

// hour 0-23
function hourStarted(day, hour) {
    console.log("hour started", hour)
    actualGraphEntriesBefore(day, hour);
}

// hour 0-23
function hourFinished(day, hour) {
    console.log("hour finished", hour)

    const load = Math.abs(actual.load[hour]); // converted to positive
    const potential_solar = actual.solar[hour]; // positive number

    const battery_ratio = batteryRatio(); // 0..10
    const solar_ratio = solarRatio(); // 0..10

    // console.log("battery_ratio", battery_ratio)
    // console.log("solar_ratio", solar_ratio)

    let battery_usage = 0;
    // can use only as much as there is left in battery
    if (battery_ratio < 0) {
        // ratio -15, -3 => -13
        // ratio 0, -3 => 0
        battery_usage = Math.max(-1 * state.battery, battery_ratio)
    }
    // cant overcharge
    if (battery_ratio > 0) {
        // ratio 15-0=0, 5 => 0
        // ratio 15-3=12, 5 => 5
        // ratio 15-12=3, 5 => 3
        battery_usage = Math.min(maxBatteryCapacity - state.battery, battery_ratio)
    }

    // console.log("battery_usage", battery_usage)

    const battery_power = -1 * battery_usage;
    const solar_power = Math.min(potential_solar, solar_ratio);

    // console.log("solar_power", solar_power)
    // console.log("battery_power", battery_power)

    // battery power might be negative if player intended to charge
    // sum can be negative if charging battery and no solar
    const total_power_provided = battery_power + solar_power;
    const power_balance = total_power_provided - load; // minus indicates shortage, have to buy

    // console.log("total_power_provided", total_power_provided)
    // console.log("power_balance", power_balance)

    // minus means shortage, flip to buy from grid
    const grid_usage = -1 * power_balance;

    // console.log("grid_usage", grid_usage)

    let final_profit = 0;
    if (power_balance < 0) { // shortage
        const buying_cost = powerCost.energy_cost[hour]
        final_profit = buying_cost * grid_usage
    } else if (power_balance > 0) { // selling to grid
        const selling_cost = powerCost.energy_cost[hour] + powerCost.grid_cost[hour]
        final_profit = selling_cost * grid_usage
    }

    state.battery += battery_usage

    // console.log("state.battery", state.battery)

    grid.update(grid_usage)
    solar.update(solar_power)
    battery.update(battery_usage)
    battery.value(state.battery)
    home.update(load)

    state.power_bill += final_profit;

    actual.battery_input.push(-1 * Math.max(battery_usage, 0))
    actual.battery_output.push(-1 * Math.min(battery_usage, 0))

    actualGraphEntriesAfter(day, hour)
    updateTotal();
}

function updateTotal() {
    const el = document.getElementById("power-bill");
    el.innerHTML = `${state.power_bill.toFixed(2)} €`
}

function clearGraphEntries() {
    const cleared = [
        "Aku tühjaks laadimine (kW)",
        "Aku laadimine (kW)",
        "Päike tegelik",
        "Tarbimise tegelik",
    ]

    for (const i in powerChart.data.datasets) {
        if (cleared.includes(powerChart.data.datasets[i].label)) {
            powerChart.data.datasets[i].data = []
        }
    }

    powerChart.update();
}

function actualGraphEntriesBefore(day, hour) {
    const entries = [
        ["Päike tegelik", "solar"],
        ["Tarbimise tegelik", "load"],
    ]

    for (const e of entries) {
        powerChart.data.datasets.find(
            d => d.label === e[0]
        ).data[hour] = actual[e[1]][hour];
    }

    powerChart.update();
}

function actualGraphEntriesAfter(day, hour) {
    const entries = [
        ["Aku laadimine (kW)", "battery_input"],
        ["Aku tühjaks laadimine (kW)", "battery_output"],
    ]

    for (const e of entries) {
        powerChart.data.datasets.find(
            d => d.label === e[0]
        ).data[hour] = actual[e[1]][hour];
    }

    powerChart.update();
}

function wholeDayPredictions() {
    powerChart.data.datasets.find(
        d => d.label === "Päikese prognoos (kW)"
    ).data = prediction.solar;
    powerChart.data.datasets.find(
        d => d.label === "Tarbimise prognoos (kW)"
    ).data = prediction.load;
    powerChart.update();

    const with_grid_cost = (costs) => costs.map(
        (value, index) => value + powerCost.grid_cost[index]
    );

    priceChart.data.datasets.find(
        d => d.label === "Müügi hind (€)"
    ).data = with_grid_cost(powerCost.energy_cost);
    priceChart.data.datasets.find(
        d => d.label === "Ostu hind (€)"
    ).data = powerCost.energy_cost;
    priceChart.update();
}

let solar_ratio_val = 0;
let battery_ratio_val = 0;

function batteryRatio() {
    // const slider = document.getElementById("battery_ratio");
    // return parseInt(slider.value)
    return battery_ratio_val;
}

function solarRatio() {
    // const slider = document.getElementById("solar_ratio");
    // return parseInt(slider.value);
    return solar_ratio_val;
}

function solar_slider_change(val) {
    solar_ratio_val = val;
    if (val == 0) return solar.still();
    if (val > 0) return solar.producing();
}

function battery_slider_change(val) {
    battery_ratio_val = val;
    if (val == 0) return battery.still();
    if (val < 0) return battery.storing();
    if (val > 0) return battery.providing();
}

// const solar_slider = document.getElementById("solar_ratio");
// solar_slider.addEventListener("input", (e) => solar_slider_change(e.target.value))

// const battery_slider = document.getElementById("battery_ratio");
// battery_slider.addEventListener("input", (e) => battery_slider_change(e.target.value))

const start_btn = document.getElementById("start");
start_btn.addEventListener("click", (e) => {
    start();
    start_btn.remove()
})
