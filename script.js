function login() {
let name = document.getElementById("username").value;

if(name === "") {
alert("Enter Name");
}
else {
localStorage.setItem("user", name);
window.location.href = "dashboard.html";
}
}

function toggleDark() {
document.body.classList.toggle("dark");
}

let yes = 0;
let no = 0;

function saveSurvey() {

let answers = [
document.getElementById("q1").value,
document.getElementById("q2").value,
document.getElementById("q3").value
];

answers.forEach(ans=>{
if(ans==="Yes") yes++;
else no++;
});

alert("Survey Submitted!");
showCharts();
}

