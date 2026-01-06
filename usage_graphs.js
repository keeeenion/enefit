// 24 hours scrolling
let hours = [...Array(24).keys()].map(i => `${i}:00`);

// second
let myygi_hind = []
let ostu_hind = []

const priceSell = [0.21, 0.20, 0.19, 0.18, 0.22, 0.30, 0.38, 0.45, 0.49, 0.48, 0.41, 0.37, 0.33, 0.28, 0.26, 0.29, 0.33, 0.39, 0.44, 0.46, 0.43, 0.38, 0.33, 0.28];
const priceBuy = priceSell.map(v => v * 1.06);

const priceChart = new Chart(document.getElementById("priceChart"), {
    type: "line",
    data: {
        labels: hours,
        datasets: [
            {
                label: "Müügi hind (€)",
                data: myygi_hind,
                borderColor: "rgba(0, 79, 225, 0.7)",
                backgroundColor: "rgba(0, 79, 225, 0.7)",
                pointRadius: 0,
            },
            {
                label: "Ostu hind (€)",
                data: ostu_hind,
                borderColor: "rgba(208, 7, 84, 0.7)",
                backgroundColor: "rgba(208, 7, 84, 0.7)",
                pointRadius: 0,
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: "bottom" },
        },
        scales: {
            x: {
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

