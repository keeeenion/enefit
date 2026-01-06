const priceChart = new Chart(document.getElementById("priceChart"), {
    type: "line",
    data: {
        labels: labels,
        datasets: [
            {
                label: "Müügi hind (€)",
                data: [],
                borderColor: "rgba(0, 79, 225, 0.7)",
                backgroundColor: "rgba(0, 79, 225, 0.7)",
                pointRadius: 0,
                pointHoverRadius: 0,
                pointHitRadius: 0,
            },
            {
                label: "Ostu hind (€)",
                data: [],
                borderColor: "rgba(208, 7, 84, 0.7)",
                backgroundColor: "rgba(208, 7, 84, 0.7)",
                pointRadius: 0,
                pointHoverRadius: 0,
                pointHitRadius: 0,
            }
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
                beginAtZero: false,
                grid: { color: "#ddd" }
            }
        }
    }
});

function updateCostChart(currentHour) {
    // Move the "Now" Line (Always moves) ---
    priceChart.options.plugins.annotation.annotations.nowLine.xMin = currentHour;
    priceChart.options.plugins.annotation.annotations.nowLine.xMax = currentHour;

    // The "Middle" Logic ---
    const halfWindow = 12; // The middle of a 24-hour view

    if (currentHour <= halfWindow) {
        // 1. Keep the window fixed at 0-23 while the line moves to the middle
        priceChart.options.scales.x.min = 0;
        priceChart.options.scales.x.max = 23;
    } else {
        // 2. Once past the middle, slide the window to keep the line centered
        // Subtract 12 from current to find the new start of the window
        priceChart.options.scales.x.min = currentHour - halfWindow;
        priceChart.options.scales.x.max = currentHour + (23 - halfWindow);
    }

    priceChart.update('active');
}

