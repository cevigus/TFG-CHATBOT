window.addEventListener("load", function () {
  const popup = document.getElementById("popup");
  const botonCerrar = document.getElementById("botonCerrar");

  popup.style.display = "flex"; // o "block", según tu CSS
  botonCerrar.style.display = "none"; // Oculta el botón mientras se muestra el popup
});

function cerrarPopup() {
  const popup = document.getElementById("popup");
  const botonCerrar = document.getElementById("botonCerrar");

  popup.style.display = "none";
  botonCerrar.style.display = "block"; // Muestra el botón al cerrar el popup
}
