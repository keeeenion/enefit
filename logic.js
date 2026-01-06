let interval;

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

let get_hour_index;

async function start() {
    clearInterval(interval);
    flowDefaults();
    allPredictions();
    updateTotal();

    // await sleep(5000);

    let ticker;

    // 10 seconds per 1 hour
    let day = 1;
    let hour = 0;
    get_hour_index = () => hourIndex(day, hour);

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

        // whole day finished
        if (perDayTimer <= 0) {
            perDayTimer = 24;
            day++;
        }

        if (decisionTimer === 100) {
            hour = hour === 24 ? 0 : hour
            hourStarted(day, hour)
        }

        // game over
        if (day >= 8) {
            clearInterval(ticker)
            gameOver();
            return;
        }

        // update decision timer
        if (decisionTimer === 100) {
            _updatePieTimerInstant(decisionTimer)
        } else {
            _updatePieTimer(decisionTimer);
        }
        _updatePieText(day, `${twoDigits(hour)}:00`);
        decisionTimer -= 10;
    }

    tick();
    // ticker = setInterval(tick, 200) // develop only
    ticker = setInterval(tick, 500) // 5 seconds per hour
}

function gameOver() {
    // todo: nothing really
}

function hourIndex(day, hour) {
    // console.log(day, hour)
    return (day - 1) * 24 + hour;
}

// hour 0-23
function hourStarted(day, hour) {
    console.log("hour started", day, hour)
    const index = hourIndex(day, hour);
    updatePowerChart(index);
    updateCostChart(index);
    actualGraphEntriesBefore(day, hour);
    clearAndWriteRatios(hourIndex(day, hour), battery_ratio_val, solar_ratio_val);
}

// hour 0-23
function hourFinished(day, hour) {
    console.log("hour finished", hour)

    const daily = daily_data[day]
    const powerCost = daily.costs;
    const actual = daily.actual;

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
    updateTotal(day, hour);
    saveToStorage(day, hour)
}

let save_game_key = (new Date()).getTime()
let memory = []
function saveToStorage(day, hour) {
    memory.push({day, hour, battery_ratio_val, solar_ratio_val})
    localStorage.setItem(`save_${save_game_key}`, JSON.stringify(memory))
}

function clearAndWriteRatios(hourIndex, battery, solar) {
    console.log(hourIndex)

    const temps = [
        ["Aku ratio", battery],
        ["Solar ratio", solar],
    ]

    for (const t of temps) {
        const l = t[0]
        const value = t[1]
        let empty = Array.from({ length: hourIndex }, (_, i) => 0);
        empty.push(value);
        console.log("empty", empty)

        powerChart.data.datasets.find(
            d => d.label === l
        ).data = empty
    }

    powerChart.update();
}

function updateTotal() {
    const el = document.getElementById("power-bill");
    el.innerHTML = `${state.power_bill.toFixed(2)} €`
}

function actualGraphEntriesBefore(day, hour) {
    const entries = [
        ["Päike tegelik", "solar"],
        ["Tarbimise tegelik", "load"],
    ]

    const actual = daily_data[day].actual

    for (const e of entries) {
        powerChart.data.datasets.find(
            d => d.label === e[0]
        ).data[hourIndex(day, hour)] = actual[e[1]][hour];
    }

    powerChart.update();
}

function actualGraphEntriesAfter(day, hour) {
    const entries = [
        ["Aku laadimine (kW)", "battery_input"],
        ["Aku tühjaks laadimine (kW)", "battery_output"],
    ]

    const actual = daily_data[day].actual

    for (const e of entries) {
        powerChart.data.datasets.find(
            d => d.label === e[0]
        ).data[hourIndex(day, hour)] = actual[e[1]][hour];
    }

    powerChart.update();
}

function allPredictions() {
    // power charts
    const loads = Object.values(daily_data).map(d => d.prediction.load).flat()
    const solars = Object.values(daily_data).map(d => d.prediction.solar).flat()

    powerChart.data.datasets.find(
        d => d.label === "Päikese prognoos (kW)"
    ).data = solars;
    powerChart.data.datasets.find(
        d => d.label === "Tarbimise prognoos (kW)"
    ).data = loads;
    powerChart.update();

    // cost charts
    const energy_costs = Object.values(daily_data).map(d => d.costs.energy_cost).flat()
    const grid_costs = Object.values(daily_data).map(d => d.costs.grid_cost).flat()

    const with_grid_cost = (costs) => costs.map(
        (value, index) => value + grid_costs[index]
    );

    priceChart.data.datasets.find(
        d => d.label === "Müügi hind (€)"
    ).data = with_grid_cost(energy_costs);
    priceChart.data.datasets.find(
        d => d.label === "Ostu hind (€)"
    ).data = energy_costs;
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
    solar_ratio_val = Number(val);
    console.log("solar_ratio_val", solar_ratio_val)
    if (get_hour_index) clearAndWriteRatios(get_hour_index(), battery_ratio_val, solar_ratio_val)
}

function battery_slider_change(val) {
    battery_ratio_val = Number(val);
    console.log("battery_ratio_val", battery_ratio_val)
    if (get_hour_index) clearAndWriteRatios(get_hour_index(), battery_ratio_val, solar_ratio_val)
}

const solar_slider = document.getElementById("solar_ratio");
solar_slider.addEventListener("input", (e) => solar_slider_change(e.target.value))

const battery_slider = document.getElementById("battery_ratio");
const normalised = (v) => [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5][v]
battery_slider.addEventListener("input", (e) => battery_slider_change(normalised(e.target.value)))

const start_btn = document.getElementById("start");
start_btn.addEventListener("click", (e) => {
    start();
    start_btn.remove()
    connectButton.remove()
})
