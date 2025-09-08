
let gameState = 'playing';
let actions = '';
let levelCurrent = 1;
let levelMax = 9;
let lastFoundItem = null;
const levelCountRequired = [0, 2, 5, 8, 12, 15, 18, 21, 24, 28]; //0 is level 0 - game starts on level 1

//Default values.  The CSV will override these
let items = {
    'fish': { pattern: 'C', src: 'images/fish.gif' },
    'ball': { pattern: 'HC', src: 'images/ball.gif' },
    'mouse': { pattern: 'HB', src: 'images/mouse.gif' },
}

//items
const itemsCSV = `
name,pattern,image,x,y
Bag,BCBC,,0,0
Pencil,BCBCBC,,0,40
ChickenHead,BCBCH,,0,80
Fish,BCH,,0,120
Glitter,BCHC,,0,160
GlueStick,BCHB,,40,0
Rubber band,BCHCB,,40,40
Frog,BCHBCH,,40,80
Litter,BCHCH,,40,120
Fruit,BCHCHC,,40,160
Ball,CB,,80,0
ArmyMan,CBCB,,80,40
Flag,CBCBCB,,80,80
Worm,CBCBCBCB,,80,120
Water,CBCH,,80,160
Apple,HBHB,,0,200
Mouse,CH,,40,200
Shoe,CHCH,,80,200
BouncyBall,HBCB,,0,240
Dice,HBHBHB,,40,240
HairBall1,HCB,,80,240
Grass,HCBC,,120,0
Grapes,HCBCB,,120,40
HairBall2,HCBHCB,,120,240
Leaf,HCH,,120,80
Keys,HCHC,,120,120
Toy,HCHCH,,120,160
Lego,HCHCB,,120,200
KeyboardKey,HCHCHC,,160,0

`;

items = csvToJson(itemsCSV);

// get random cat death message
const deathMessages = [
    "You died! Never pet a cat's belly.",
    "You died! The cat didn't like that.",
    "You died! Soft belly = death.",
    "You died! Cat tricked you into petting its belly."
];

const itemsFound = [];

let lastArea = null;
function addAction(area) {
    if (gameState === 'lost') return;
    if (!area) return;
    console.log(area);
    const lastAction = actions.slice(-1);
    if (lastAction != area) {
        actions = actions + area;
    }

    //check for belly is in list and die if present instantly before processing actions
    if (actions.includes('X')) {
        gameOver();
        return;
    }

    //show based on actions
    updateUI();

}

function processActions() {
    if (gameState === 'lost') return;

    itemAction(actions);

    //check for level up
    checkForLevelUp();

    updateUI();
}
function itemAction(actions) {
    if (actions.length === 0) return;
    const item = findPatternItem(actions);
    if (item) {
        // Handle the matched pattern
        console.log(`Pattern matched: ${item}`);
        // document.getElementById('found').innerHTML = `<span>Found: ${item.name}</span>`;

        // Animate ball if found
        animateItem(item);

        //add to foundItems
        lastFoundItem = item.name;
        const foundItem = itemsFound.find(i => i.name === item.name);
        if (foundItem) {
            foundItem.count++;
        } else {
            itemsFound.push({ name: item.name, count: 1 });
        }

        coughAudio();

    } else {
        lastFoundItem = null;
        meowAudio();
    }

}
function checkForLevelUp() {
    //check for level up
    if (levelCurrent < levelMax && itemsFound.length >= levelCountRequired[levelCurrent]) {
        levelCurrent++;
        // Play level up sound
        levelUpAudio();

        if (levelCurrent === levelMax) {
            // Play final level up sound
            finalLevelUpAudio();

            gameState = 'won';
        }
    }

}
function animateItem(item) {
    if (!item) return;
    // Sprite sheet logic
    // If item.spriteSheet is defined, use sprite sheet, else fallback to single image
    let useSprite = !item.image;
    const catAreaH = document.querySelector('#items');
    if (!catAreaH) return;


    let newElem;
    if (useSprite) {
        const spriteFrame = { x: item.x || 0, y: item.y || 0, w: item.w || 40, h: item.h || 40 };
        // Use a div with background image and position
        newElem = document.createElement('div');
        newElem.className = 'item animated-item sprite-item';
        // Sprite sheet path and frame position
        const sheet = item.spriteSheet || 'images/item-spritesheet.gif';
        const frame = spriteFrame;
        newElem.style.backgroundImage = `url('${sheet}')`;
        newElem.style.backgroundPosition = `-${frame.x}px -${frame.y}px`;
        newElem.style.width = frame.w + 'px';
        newElem.style.height = frame.h + 'px';
        newElem.style.position = 'absolute';
        newElem.style.top = '100px';
        newElem.style.left = '20px';
        newElem.style.opacity = '1';
        newElem.style.transform = 'scale(1) rotate(-20deg)';
    } else {
        // Fallback to single image
        const itemSrc = 'images/' + (item.src || item.name.toLowerCase() + '.gif');
        newElem = document.createElement('img');
        newElem.src = itemSrc;
        newElem.alt = item.name;
        newElem.className = 'item animated-item';
        newElem.style.position = 'absolute';
        newElem.style.top = '100px';
        newElem.style.left = '20px';
        newElem.style.opacity = '1';
        newElem.style.transform = 'scale(1) rotate(-20deg)';
    }

    catAreaH.appendChild(newElem);

    // Generate random target position within reasonable bounds
    const minLeft = -180, maxLeft = 120;
    const minTop = 190, maxTop = 270;
    const targetLeft = Math.floor(Math.random() * (maxLeft - minLeft + 1)) + minLeft;
    const targetTop = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

    // Animate using Web Animations API
    newElem.animate([{
        top: '120px',
        left: '30px',
        opacity: 1,
        transform: 'scale(1) rotate(-20deg)'
    },
    {
        top: targetTop + 'px',
        left: targetLeft + 'px',
        opacity: 1,
        transform: 'scale(1.2) rotate(0deg)'
    }
    ], {
        duration: 1200,
        easing: 'cubic-bezier(.5,1.5,.5,1)',
        fill: 'forwards'
    });

}
function findPatternItem(actions) {
    // Check for exact match (order and length)

    for (const item of Object.values(items)) {
        const pattern = item.pattern;
        if (actions === pattern)
            return item;
    }
    return null;
}
function gameOver() {
    gameState = 'lost';
    //itemsFound.length = 0;
    // Play buzz.mp3 audio on game over
    //const audio = new Audio('audio/buzz.mp3');
    //audio.play();
    buzzAudio();
    updateUI();
}
function clearActions() {
    if (gameState === 'lost') {
        resetGame();
    }
    actions = '';
}
function resetGame() {

    //reset
    gameState = 'playing';
    itemsFound.length = 0;
    levelCurrent = 1;
    //remove all #item elements
    const items = document.querySelectorAll('#items div');
    items.forEach(item => item.remove());


    actions = '';

    updateUI();
}
function updateUI() {

    document.getElementById('level').innerHTML = `Level: ${levelCurrent}`;
    document.getElementById('progress').innerHTML = `- ${itemsFound.length}/${levelCountRequired[levelCurrent]}`;

    //document.getElementById('found').innerHTML = itemsFound.map(item => `<span>Found: ${item.name} (x${item.count})</span>`).join(' ');
    document.getElementById('inventory').innerHTML = `
    <ul>
    ${itemsFound.map(item => `<li>(x${item.count}) - ${item.name} - ${items[item.name].pattern}</li>`).join(' ')}
    </ul>`;


    if (gameState === 'lost') {
        const randomMessage = deathMessages[Math.floor(Math.random() * deathMessages.length)];
        document.getElementById('message').innerHTML = `<span style="color: red;">${randomMessage}</span>`;
    } else if (gameState === 'won') {
        document.getElementById('message').innerHTML = '<span style="color: green;">You won!</span>';
    } else if (lastFoundItem) {
        document.getElementById('message').innerHTML = `<span>Found: ${lastFoundItem}</span>`;
    } else {
        document.getElementById('message').innerHTML = '<span>Pet the cat!</span>';
    }


    document.getElementById('actions').innerHTML = actions;


    // //get last action, last letter
    // const lastAction = actions[actions.length - 1];
    // if (lastAction === 'H') {
    //     document.getElementById('cat-img').src = 'images/cat-head.gif';
    // } else if (lastAction === 'C') {
    //     document.getElementById('cat-img').src = 'images/cat-back.gif';
    // } else if (lastAction === 'B') {
    //     document.getElementById('cat-img').src = 'images/cat-butt.gif';
    // } else if (lastAction === 'L') {
    //     document.getElementById('cat-img').src = 'images/cat-leg.gif';
    // } else if (lastAction === 'X') {
    //     document.getElementById('cat-img').src = 'images/cat-death.gif';
    // } else {
    //     //back
    //     document.getElementById('cat-img').src = 'images/cat-back.gif';
    // }



    // if (gameState === 'lost') {
    //     document.getElementById('cat-img').src = 'images/cat-death.gif';
    // }


    //get last action, last letter
    // Use cat-spritesheet.gif for all cat images
    const catImg = document.getElementById('cat-img');
    catImg.style.backgroundImage = "url('images/cat-spritesheet.gif')";
    catImg.style.backgroundRepeat = 'no-repeat';
    catImg.style.width = '400px';
    catImg.style.height = '250px';
    // Map each cat part to its frame in the spritesheet (frame size is 300x200, but we want to display at 400x250)
    const spriteFrames = {
        'C': { x: 0, y: 0 },        // back
        'X': { x: 0, y: 200 },      // death
        'B': { x: 0, y: 400 },      // butt
        'H': { x: 0, y: 600 },      // head
        'L': { x: 0, y: 800 },      // leg
        'default': { x: 0, y: 0 } // back
    };
    let frame = spriteFrames['default'];
    const lastAction = actions[actions.length - 1];
    if (gameState === 'lost') {
        frame = spriteFrames['X'];
    } else if (spriteFrames[lastAction]) {
        frame = spriteFrames[lastAction];
    }
    // Scale the background position to match the new frame size
    const scaleX = 400 / 300;
    const scaleY = 250 / 200;
    catImg.style.backgroundPosition = `-${frame.x * scaleX}px -${frame.y * scaleY}px`;
    catImg.style.backgroundSize = '400px 1000px'; // scale to match the actual image height (5 frames × 200px = 1000px)
    // Remove src attribute if present
    if (catImg.hasAttribute('src')) catImg.removeAttribute('src');





}



function setUpEventListeners() {
    let isPointerDown = false;
    let pointerId = null;
    let lastArea = null;

    function getCatAreaUnderPointer(e) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.classList && el.classList.contains('cat-area')) {
            return el.getAttribute('data-area');
        }
        return null;
    }

    window.addEventListener('pointerdown', function (e) {
        isPointerDown = true;
        pointerId = e.pointerId;
        const area = getCatAreaUnderPointer(e);
        clearActions();
        if (area) {
            addAction(area);
        }
        lastArea = area;

    });

    window.addEventListener('pointerup', function (e) {
        if (!isPointerDown || pointerId !== e.pointerId) return;
        isPointerDown = false;
        pointerId = null;
        lastArea = null;
        processActions();

    });

    window.addEventListener('pointercancel', function (e) {
        if (!isPointerDown || pointerId !== e.pointerId) return;
        isPointerDown = false;
        pointerId = null;
        lastArea = null;
    });

    window.addEventListener('pointermove', function (e) {

        if (!isPointerDown || pointerId !== e.pointerId) return;
        const area = getCatAreaUnderPointer(e);
        if (area !== lastArea) {
            if (area) {
                // Entered a new cat-area
                addAction(area);
            }
            // Optionally, you could handle leave event for lastArea here
            lastArea = area;
        }
    });
};
function init() {

    setUpEventListeners();
    updateUI();
}
function buzzAudio() {
    // Generate buzzer sound using Web Audio API
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.7; // seconds (slightly longer)
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(120, ctx.currentTime); // buzzer frequency
    gain.gain.setValueAtTime(0.2, ctx.currentTime); // volume
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    oscillator.onended = () => {
        ctx.close();
    };

}
function meowAudio() {

    // Generate a short, old school meow sound using Web Audio API, with randomization
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Randomize duration and pitch (shorter meow)
    const duration = 0.11 + Math.random() * 0.09; // 0.11-0.20s
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const types = ['square', 'triangle'];
    const oscType = types[Math.floor(Math.random() * types.length)];
    osc.type = oscType;
    // Randomize pitch sweep
    const startFreq = 350 + Math.random() * 120; // 350-470Hz
    const peakFreq = 700 + Math.random() * 180; // 700-880Hz
    const endFreq = 140 + Math.random() * 80; // 140-220Hz
    const upTime = 0.04 + Math.random() * 0.06; // 0.04-0.10s
    const downTime = 0.09 + Math.random() * 0.09; // 0.09-0.18s
    // Envelope
    const startGain = 0.001;
    const peakGain = 0.22 + Math.random() * 0.12;
    const midGain = 0.08 + Math.random() * 0.12;
    // Log options
    console.log('[meowAudio - meow] options:', {
        duration, oscType, startFreq, peakFreq, endFreq, upTime, downTime, peakGain, midGain
    });
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(peakFreq, ctx.currentTime + upTime);
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(startGain, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + upTime * 0.7);
    gain.gain.linearRampToValueAtTime(midGain, ctx.currentTime + upTime + downTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
}
function coughAudio() {
    // Dramatic cartoon cat barf sound: pitch drop + gurgle, randomized each play
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Randomize duration and oscillator type
    const duration = 0.6 + Math.random() * 0.3; // 0.6-0.9s
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const types = ['triangle', 'sawtooth', 'square'];
    const oscType = types[Math.floor(Math.random() * types.length)];
    osc.type = oscType;
    // Randomize start/end frequencies
    const startFreq = 500 + Math.random() * 300; // 500-800Hz
    const midFreq = 60 + Math.random() * 40; // 60-100Hz
    const endFreq = 20 + Math.random() * 40; // 20-60Hz
    // Randomize gain envelope
    const startGain = 0.4 + Math.random() * 0.3;
    const peakGain = 0.6 + Math.random() * 0.3;
    const endGain = 0.15 + Math.random() * 0.15;
    const midTime = duration * (0.5 + Math.random() * 0.3);
    const peakTime = 0.1 + Math.random() * 0.1;
    // Log options
    console.log('[coughAudio] options:', {
        duration,
        oscType,
        startFreq,
        midFreq,
        endFreq,
        startGain,
        peakGain,
        endGain,
        midTime,
        peakTime
    });
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(midFreq, ctx.currentTime + midTime);
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(startGain, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + peakTime);
    gain.gain.linearRampToValueAtTime(endGain, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
}
function levelUpAudio() {
    console.log('[levelUpAudio] Playing level up audio');
    // Old-school game level-up jingle: C5-E5-G5 (quick arpeggio)
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.14;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.connect(ctx.destination);
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * duration);
        osc.connect(gain);
        osc.start(ctx.currentTime + i * duration);
        osc.stop(ctx.currentTime + (i + 1) * duration);
        osc.onended = () => {
            if (i === notes.length - 1) ctx.close();
        };
    });
}
function finalLevelUpAudio() {
    // Longer retro win jingle: C E G C (octave up) E G B C (octave up) G E C (flourish)
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // C5, E5, G5, C6, E6, G6, B6, C7, G6, E6, C6
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 1975.53, 2093, 1567.98, 1318.5, 1046.5];
    const durations = [0.13, 0.13, 0.13, 0.13, 0.13, 0.13, 0.13, 0.18, 0.09, 0.09, 0.22];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.connect(ctx.destination);
    let t = ctx.currentTime;
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = i < 7 ? 'triangle' : 'square'; // flourish with square
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + durations[i]);
        osc.onended = () => {
            if (i === notes.length - 1) ctx.close();
        };
        t += durations[i];
    });
}
function csvToJson(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const result = {};
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentLine = lines[i].split(',');
        const key = currentLine[0];
        obj.name = currentLine[0];
        obj.pattern = currentLine[1];
        obj.src = currentLine[2];
        obj.x = parseInt(currentLine[3]) || 0;
        obj.y = parseInt(currentLine[4]) || 0;
        result[key] = obj;
    }
    return result;
}


init();

