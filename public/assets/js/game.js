const socket = io();

const startEl = document.querySelector('#start');
const gameWrapperEl = document.querySelector('#game-wrapper');
const usernameFormEl = document.querySelector('#username-form');
const gameboardEl = document.querySelector('#game-board');
const waitingEl = document.querySelector('#waiting');
const scoreEl = document.querySelector('#score');
const reactionTimeEl = document.querySelector('#reaction');
const timerEl = document.querySelector('#timer');
const endGameEl = document.querySelector('#endgame');
const endGameTextEl = document.querySelector('#endgametext');
const playAgainEl = document.querySelector('#playAgain');

const gameboard = [
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
]

const renderGame = (session) => {
    waitingEl.classList.add("hide");

    gameWrapperEl.classList.remove("hide");

    socket.emit("user:startgame", session, socket.id);
}

socket.on("user:connected", (username) => {
    console.log(`${username} connected 🥳`);
});

socket.on("user:disconnected", (username) => {
    console.log(`${username} disconnected 😢`);

    endGameEl.classList.remove("hide");
    endGameTextEl.innerHTML = `${username} disconnected :(`;
    playAgainEl.innerHTML = "Try again?";

    playAgainEl.addEventListener("click", () => {
        window.location.reload();
    })
});

socket.on("user:session", (username, session, startGame) => {
    console.log(`${username} joined session ${session}`);

    if (startGame) {
        renderGame(session);
    }
});

socket.on("game:success", data => {

    let i = 1;

    if (data.success) {
        gameboardEl.innerHTML = gameboard.map(y => 
            `<div class="row" data-y="${i}">
            ${i++,
                y.map(x => 
                    `<div class="col" data-x="${x}">
                        
                    </div>`
                ).join('')
            }
            </div>`
        ).join('')

        let cords = document.querySelector(`[data-y="${data.y}"] [data-x="${data.x}"]`);

        setTimeout(() => {
            var start = Date.now();

            cords.addEventListener("click", e => {
                var reactionTime = Date.now() - start;
                clicked = true;

                cords.classList.remove("virus");
                cords.classList.add("clickedvirus");

                socket.emit("game:point", reactionTime, socket.id, data.session);
            })
            cords.classList.add("virus");
        }, data.time)
    }
})

socket.on("game:result", (winner, points, keepRunning, session) => {
    console.log(points);
    console.log(reactionTimeEl)

    if (points.player1 === socket.id) {
        scoreEl.innerHTML = `
            <span>${points.player1Points}</span>
                -
            <span>${points.player2Points}</span>
        `
        timerEl.innerHTML = ''
        reactionTimeEl.innerHTML = `
            <span>${points.player1Name } - ${points.player1React} ms</span>
                -
            <span>${points.player2Name} - ${points.player2React} ms</span>
        `
    } else {
        scoreEl.innerHTML= `
            <span>${points.player2Points}</span>
                -
            <span>${points.player1Points}</span>
        `
        timerEl.innerHTML= '';
        reactionTimeEl.innerHTML= `
            <span>${points.player2Name} - ${points.player2React} ms</span>
            <br />
            <span>${points.player1Name} - ${points.player1React} ms</span>
        `
    }

    if (keepRunning) {
        winner = socket.id ? console.log("you won") : console.log("you lost");

        setTimeout(() => {
            console.log("new round");
            renderGame(session);
        }, 2000)
    } else {
        console.log("game over");
        socket.emit("game:end", session, socket.id);
    }
})

socket.on("game:endresult", (winnerGame, session) => {
    if (winnerGame === socket.id) {
        endGameEl.classList.remove("hide");
        endGameTextEl.innerHTML = `
            <div class="alert alert-info">Winner</div>
        `
    } else {
        endGameEl.classList.remove("hide");
        endGameTextEl.innerHTML = `
            <div class="alert alert-danger">Loser</div>
        `
    }

    playAgainEl.addEventListener("click", () => {
        console.log("Play Again");

        scoreEl.innerHTML = `
            <span>0</span>
                -
            <span>0</span>
        `;

        reactionTimeEl.innerHTML = "";
        waitingEl.classList.remove("hide");
        endGameEl.classList.add("hide");
        socket.emit("game:restart", session, socket.id);
    })
})

socket.on("game:restarted", (session) => {
    renderGame(session)
})

usernameFormEl.addEventListener("submit", e => {
    e.preventDefault();

    username = usernameFormEl.username.value;

    socket.emit("user:joined", username, (status) => {
        console.log("Server responded with", status);

        if (status.success) {
            startEl.classList.add("hide");

            if (!status.start) {
                waitingEl.classList.remove("hide");
            } 
        }
    });
});