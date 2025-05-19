fetch("menu.html")
  .then(response => response.text())
  .then(html => {
    document.getElementById("menuLateral").innerHTML = html;
  });
