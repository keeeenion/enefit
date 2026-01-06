let viewStart = 0;
let viewEnd = 23;

const days = 7;

function generateDayAnnotations(days) {
    const annotations = {};

    for (let i = 0; i < days; i++) {
        const start = i * 24;
        const end = start + 24;
        const isEven = i % 2 === 0;

        annotations[`dayBlock${i}`] = {
            type: 'box',
            xMin: start - 0.5,
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

const dayAnnotations = generateDayAnnotations(days);
// console.log("dayAnnotations", dayAnnotations)

const labels = Array.from({ length: days * 24 }, (_, i) => {
    // const day = Math.floor(i / 24) + 1;
    const hr = i % 24;
    return `${hr}:00`;
});

function createStripped(color) {
    const shapeCanvas = document.createElement('canvas');
    const shapeCtx = shapeCanvas.getContext('2d');
    shapeCanvas.width = 10;
    shapeCanvas.height = 10;

    shapeCtx.strokeStyle = color;
    shapeCtx.lineWidth = 2;
    shapeCtx.beginPath();
    shapeCtx.moveTo(0, 10);
    shapeCtx.lineTo(10, 0);
    shapeCtx.stroke();

    return shapeCtx.createPattern(shapeCanvas, 'repeat');
}

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
                pointHoverRadius: 0,
                pointHitRadius: 0,
                // borderWidth: 2
            },
            {
                type: "line",
                label: "Tarbimise prognoos (kW)",
                data: [],
                borderColor: "rgba(46, 105, 255, 0.7)",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                pointRadius: 0,
                pointHoverRadius: 0,
                pointHitRadius: 0,
                // borderWidth: 2
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

            // temporary
            {
                label: "Aku ratio",
                data: [],
                stack: "temp",
                order: 10,
                backgroundColor: createStripped("rgba(0,200,140,0.7)"),
                borderColor: "rgba(0,200,140,0.7)",
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 1.0,
            },
            {
                label: "Solar ratio",
                data: [],
                stack: "temp",
                order: 11,
                backgroundColor: createStripped("rgba(217, 255, 0, 0.7)"),
                borderColor: "rgba(217, 255, 0, 0.7)",
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 1.0,
            },
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    filter: function(item) {
                        const hiddenLabels = ["Aku ratio", "Solar ratio"];
                        return !hiddenLabels.includes(item.text);
                    }
                }
            },
            annotation: {
                annotations: {
                    ...dayAnnotations,
                    nowLine: {
                        type: 'line',
                        xMin: 0,
                        xMax: 0,
                        borderColor: 'red',
                        borderWidth: 2,
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

function updatePowerChart(hourIndex) {
    // Move the "Now" Line (Always moves) ---
    powerChart.options.plugins.annotation.annotations.nowLine.xMin = hourIndex;
    powerChart.options.plugins.annotation.annotations.nowLine.xMax = hourIndex;

    // The "Middle" Logic ---
    const halfWindow = 12; // The middle of a 24-hour view

    // console.log("hourIndex", hourIndex)
    if (hourIndex <= halfWindow) {
        // 1. Keep the window fixed at 0-23 while the line moves to the middle
        powerChart.options.scales.x.min = 0;
        powerChart.options.scales.x.max = 23;
    } else {
        // 2. Once past the middle, slide the window to keep the line centered
        // Subtract 12 from current to find the new start of the window
        powerChart.options.scales.x.min = hourIndex - halfWindow;
        powerChart.options.scales.x.max = hourIndex + (23 - halfWindow);
    }

    powerChart.update('active');
}
