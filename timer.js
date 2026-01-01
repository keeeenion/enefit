function _updatePieTimer(percent) {
    // percent: number 0–100
    const circle = document.getElementById("pieFill");

    // Chart.js uses 100 as full circumference
    const fill = percent;
    const empty = 100 - percent;

    circle.style.strokeDasharray = `${fill} ${empty}`;
}

function _updatePieText(day, time) {
    const el = document.getElementById("timer-text");
    el.innerHTML = `Päev ${day}<br>${time}`
}

