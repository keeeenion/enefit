let viewStart = 0;
let viewEnd = 23;

const days = 7;

function generateDayAnnotations(totalHours) {
    const annotations = {};
    const days = Math.ceil(totalHours / 24);

    for (let i = 0; i < days; i++) {
        const start = i * 24;
        const end = start + 24;
        const isEven = i % 2 === 0;
        
        annotations[`dayBlock${i}`] = {
            type: 'box',
            xMin: start - 0.5, // Offset by 0.5 to center the boundary between bars
            xMax: end - 0.5,
            backgroundColor: isEven ? 'rgba(200, 200, 200, 0.2)' : 'transparent',
            borderWidth: 0,
            z: -10, // Ensure it stays behind bars
            label: {
                display: true,
                // content: i === 0 ? 'TÄNA' : (i === 1 ? 'HOMME' : `PÄEV ${i + 1}`),
                position: {
                    x: 'center',
                    y: 'start'
                },
                color: 'rgba(100, 100, 100, 0.6)',
                font: {
                    size: 11,
                    weight: 'bold'
                },
                yAdjust: 10
            }
        };
    }
    return annotations;
}

const dayAnnotations = generateDayAnnotations(days*24);

const labels = Array.from({ length: days*24 }, (_, i) => {
    // const day = Math.floor(i / 24) + 1;
    const hr = i % 24;
    return `${hr}:00`;
});

const powerChart = new Chart(document.getElementById("powerChart"), {
    type: "bar",
    categoryPercentage: 1.0,
    barPercentage: 1.0,
    data: {
        labels,
        datasets: [
            {
                type: "line",
                label: "Päikese prognoos (kW)",
                data: [],
                borderColor: "rgba(255,153,0,0.7)",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                pointRadius: 0,
            },
            {
                type: "line",
                label: "Tarbimise prognoos (kW)",
                data: [],
                borderColor: "rgba(46, 105, 255, 0.7)",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                pointRadius: 0,
            },
            {
                label: "Aku tühjaks laadimine (kW)",
                stack: "hour",
                order: 2,
                data: [],
                backgroundColor: "rgba(0,200,140,0.7)",
                barPercentage: 0.7,
                categoryPercentage: 1.0,
            },
            {
                label: "Aku laadimine (kW)",
                data: [],
                stack: "hour",
                order: 4,
                backgroundColor: "rgba(0, 154, 177, 0.7)",
                barPercentage: 0.7,
                categoryPercentage: 1.0,
            },
            {
                label: "Päike tegelik",
                stack: "hour",
                order: 1,
                data: [],
                backgroundColor: "rgba(217, 255, 0, 0.7)",
                barPercentage: 0.7,
                categoryPercentage: 1.0,
            },
            {
                label: "Tarbimise tegelik",
                data: [],
                stack: "hour",
                order: 3,
                backgroundColor: "rgba(30, 0, 255, 0.7)",
                barPercentage: 0.7,
                categoryPercentage: 1.0,
            },
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: "bottom" },
            annotation: {
                annotations: {
                    ...dayAnnotations,
                    nowLine: {
                        type: 'line',
                        xMin: 0,
                        xMax: 0,
                        borderColor: 'red',
                        borderWidth: 3,
                        label: {
                            display: false,
                            content: 'NÜÜD',
                            position: 'center',
                            backgroundColor: 'rgba(21, 173, 197, 0.8)'
                        }
                    }
                }
            }
        },
        scales: {
            x: {
                min: viewStart,
                max: viewEnd,
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                beginAtZero: true,
                grid: { color: "#ddd" }
            }
        }
    }
});

const power_state = {
    current_hour: 0,
    total_hours: 0,
}

function initPowerChart(days) {
    const hours = days
    power_state.current_hour = 0;
    power_state.total_hours = hours;
}

function updateChart(currentHour) {
    // Move the "Now" Line (Always moves) ---
    powerChart.options.plugins.annotation.annotations.nowLine.xMin = currentHour;
    powerChart.options.plugins.annotation.annotations.nowLine.xMax = currentHour;

    // The "Middle" Logic ---
    const halfWindow = 12; // The middle of a 24-hour view

    if (currentHour <= halfWindow) {
        // 1. Keep the window fixed at 0-23 while the line moves to the middle
        powerChart.options.scales.x.min = 0;
        powerChart.options.scales.x.max = 23;
    } else {
        // 2. Once past the middle, slide the window to keep the line centered
        // Subtract 12 from current to find the new start of the window
        powerChart.options.scales.x.min = currentHour - halfWindow;
        powerChart.options.scales.x.max = currentHour + (23 - halfWindow);
    }

    powerChart.update('active');

    currentHour++;
}
