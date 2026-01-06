function _updatePieTimer(percent) {
    // percent: number 0–100
    const circle = document.getElementById("pieFill");

    // Chart.js uses 100 as full circumference
    const fill = percent;
    const empty = 100 - percent;

    circle.style.strokeDasharray = `${fill} ${empty}`;
}

function _updatePieTimerInstant() {
    const circle = document.getElementById("pieFill");
    circle.style.transition = 'none';
    circle.style.strokeDasharray = "100 0";
    circle.offsetHeight;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            circle.style.transition = 'stroke-dasharray 0.3s linear';
        });
    });
}

function _updatePieText(day, time) {
    const el = document.getElementById("timer-text");
    el.innerHTML = `Päev ${day}<br>${time}`
}

