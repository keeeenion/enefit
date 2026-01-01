
const hours = [...Array(24).keys()]; // 0–23

// first
let tarbimine_prognoos = [];
let tarbimine_tegelik = []
let paike_prognoos = []
let paike_tegelik = []
let aku_tyhjaks = []
let aku_laadimine = []

// second
let myygi_hind = []
let ostu_hind = []

const powerChart = new Chart(document.getElementById("powerChart"), {
    type: "bar",
    categoryPercentage: 1.0,
    barPercentage: 1.0,
    data: {
        labels: hours,
        datasets: [
            {
                type: "line",
                label: "Päikese prognoos (kW)",
                data: paike_prognoos,
                borderColor: "rgba(255,153,0,0.7)",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                pointRadius: 0,
            },
            {
                type: "line",
                label: "Tarbimise prognoos (kW)",
                data: tarbimine_prognoos,
                borderColor: "rgba(46, 105, 255, 0.7)",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                pointRadius: 0,
            },
            {
                label: "Aku tühjaks laadimine (kW)",
                stack: "hour",
                order: 2,
                data: aku_tyhjaks,
                backgroundColor: "rgba(0,200,140,0.7)",
                barPercentage: 0.7,
                categoryPercentage: 1.0,
            },
            {
                label: "Aku laadimine (kW)",
                data: aku_laadimine,
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
                data: paike_tegelik,
                backgroundColor: "rgba(217, 255, 0, 0.7)",
                barPercentage: 0.7,
                categoryPercentage: 1.0,
            },
            {
                label: "Tarbimise tegelik",
                data: tarbimine_tegelik,
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
        plugins: { legend: { position: "bottom" } },
        scales: {
            x: {
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
        plugins: { legend: { position: "bottom" } },
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
