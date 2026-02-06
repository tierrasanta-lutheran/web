console.log(">>> global.js EXECUTED <<<");

function sayHello() {
  alert("hello");
}

function AddGlobalBlurb(event, text) {
        const container = document.createElement("div");
        container.className = "recurrence-date";
  const textToInsert = text ?? "Hey!  This is injected text";
        container.innerHTML = `<div class="recurrence-date-display">${textToInsert}</div>`;

        // Append it wherever you want — here we add it at the bottom
        event.appendChild(container);
}

console.log("global.js loaded", window.sayHello);

