window.addEventListener("load", function () {
  const popup = document.getElementById("popup");
  popup.style.display = "flex"; // o "block", según tu CSS
});

function cerrarPopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
}
