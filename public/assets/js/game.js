const socket = io();

const startEl = document.querySelector('#start');
const gameWrapperEl = document.querySelector('#game-wrapper');
const usernameFormEl = document.querySelector('#username-form');
const gameboardEl = document.querySelector('#game-board');
const waitingEl = document.querySelector('#waiting');

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

const renderGame = () => {
    waitingEl.classList.add("hide");

    gameWrapperEl.classList.remove("hide");

    let i = 1;

    socket.emit("user:startgame", (status) => {
        console.log(status);

        if (status.success) {
            gameboardEl.innerHTML = gameboard.map(y => 
                `<div class=row>
                    ${
                        y.map(x => 
                            `<div class="col" data-x="${x}">
                                ${x}
                            </div>`
                        ).join("")
                    }
                </div>`
            ).join("")

            let cords = document.querySelector(`[data-y="${status.y}"] [data-x="${status.x}"]`);

            setTimeout(() => {
                var start = Date.now();

                cords.addEventListener("click", e => {
                    var reactionTime = Date.now() - start;

                    console.log(reactionTime);
                })
                cords.classList.add("virus");
            }, status.time)
        }
    });
}

socket.on("user:connected", (username) => {
    console.log(`${username} connected 🥳`);
});

socket.on("user:disconnected", (username) => {
    console.log(`${username} disconnected 😢`);
});

socket.on("user:session", (username, session, startGame) => {
    console.log(`${username} joined session ${session}`);

    if (startGame) {
        renderGame();
    }
});

usernameFormEl.addEventListener("submit", e => {
    e.preventDefault();

    username = usernameFormEl.username.value;

    socket.emit("user:joined", username, (status) => {
        console.log("Server responded with", status);

        if (status.success) {
            startEl.classList.add("hide");

            if (!status.start) {
                waitingEl.classList.remove("hide");
            } else {
                renderGame();
            }
        }
    });
});