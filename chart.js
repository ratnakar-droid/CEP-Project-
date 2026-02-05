function showCharts(){

new Chart(document.getElementById("pieChart"), {
type: "pie",
data: {
labels: ["Yes", "No"],
datasets: [{
data: [yes,no]
}]
}
});

new Chart(document.getElementById("barChart"), {
type: "bar",
data: {
labels: ["Yes", "No"],
datasets: [{
data: [yes,no]
}]
}
});

}