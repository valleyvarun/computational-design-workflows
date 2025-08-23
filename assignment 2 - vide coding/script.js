const codeLines = [
  "function fightCrime() {",
  "  const villain = 'Joker';",
  "  const location = 'Gotham';",
  "  if (night) {",
  "    summon(Batman);",
  "    track(villain, location);",
  "    defend(location);",
  "  }",
  "}",
  "",
  "while (justice < 100) {",
  "  vibeCode();",
  "  stayInShadows();",
  "}"
];

let currentLine = 0;
let currentChar = 0;
const typingElement = document.getElementById('typing');

function typeCode() {
  if (currentLine < codeLines.length) {
    const line = codeLines[currentLine];
    if (currentChar < line.length) {
      typingElement.innerHTML += line[currentChar];
      currentChar++;
    } else {
      typingElement.innerHTML += '\n';
      currentLine++;
      currentChar = 0;
    }
    setTimeout(typeCode, 50);
  } else {
    // Wait 1 second and restart
    setTimeout(() => {
      typingElement.innerHTML = '';
      currentLine = 0;
      currentChar = 0;
      typeCode();
    }, 1000);
  }
}

window.onload = () => {
  typeCode();
};



function spawnBats(num = 10) {
  const container = document.getElementById('bats-container');

  for (let i = 0; i < num; i++) {
    const bat = document.createElement('img');
    bat.src = 'bat-symbol.png'; // your local image
    bat.classList.add('bat');

    // Random initial position
    bat.style.top = `${Math.random() * 100}vh`;
    bat.style.left = `${Math.random() * 100}vw`;

    // Random animation direction and speed
    const x = `${Math.random() * 200 - 100}vw`;
    const y = `${Math.random() * 200 - 100}vh`;
    bat.style.setProperty('--x', x);
    bat.style.setProperty('--y', y);
    bat.style.animationDuration = `${5 + Math.random() * 10}s`;

    container.appendChild(bat);
  }
}

// 👇 Already existing function call; now add bat spawn
window.onload = () => {
  typeCode();
  spawnBats(12); // Number of flying bats
};
