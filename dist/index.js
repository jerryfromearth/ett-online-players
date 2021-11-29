"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const DEBUG = false;
const cellsTemplate = [
    "links",
    "id",
    "name",
    "elo",
    "opponent",
    "last online",
    "online",
];
class Player {
    constructor(json) {
        var _a, _b, _c;
        let data = json.data;
        this.id = parseInt(data.id);
        this.name = (_a = data === null || data === void 0 ? void 0 : data.attributes) === null || _a === void 0 ? void 0 : _a["user-name"];
        this.ELO = (_b = data === null || data === void 0 ? void 0 : data.attributes) === null || _b === void 0 ? void 0 : _b.elo;
        this.rank = (_c = data === null || data === void 0 ? void 0 : data.attributes) === null || _c === void 0 ? void 0 : _c.rank;
        this.lastOnline = 0;
    }
    fillName(json) {
        var _a, _b, _c, _d;
        let data = json.data;
        this.id = parseInt(data.id);
        this.name = (_a = data === null || data === void 0 ? void 0 : data.attributes) === null || _a === void 0 ? void 0 : _a["user-name"];
        this.ELO = (_b = data === null || data === void 0 ? void 0 : data.attributes) === null || _b === void 0 ? void 0 : _b.elo;
        this.rank = (_c = data === null || data === void 0 ? void 0 : data.attributes) === null || _c === void 0 ? void 0 : _c.rank;
        this.lastOnline = Date.parse((_d = data === null || data === void 0 ? void 0 : data.attributes) === null || _d === void 0 ? void 0 : _d["last-online"]);
    }
    fillOnlineInfo(json) {
        var _a;
        let users = json.OnlineUses.filter((onlinePlayer) => onlinePlayer.Id === this.id.toString());
        if (users.length > 0) {
            this.online = true;
            this.device = users[0].Device;
            this.name = users[0].UserName;
            this.ELO = Math.floor(users[0].ELO);
        }
        else {
            this.online = false;
            this.device = undefined;
        }
        let rooms = json.Rooms.filter((room) => {
            let roomplayers = room.Players;
            for (let i = 0; i < roomplayers.length; i++) {
                if (roomplayers[i].Id === this.id.toString()) {
                    return true;
                }
            }
            return false;
        });
        if (rooms.length > 0) {
            let room = rooms[0];
            room.Players.forEach((roomplayer) => {
                if (roomplayer.Id !== this.id.toString()) {
                    this.opponent = roomplayer.UserName;
                    this.opponentELO = roomplayer.ELO;
                    this.opponentid = roomplayer.Id;
                }
            });
            this.ranked = (_a = room === null || room === void 0 ? void 0 : room.Match) === null || _a === void 0 ? void 0 : _a.Ranked;
        }
        else {
            this.opponent = undefined;
            this.opponentELO = undefined;
            this.opponentid = undefined;
            this.ranked = undefined;
        }
    }
}
let players = [];
function updateCountdown(countdown) {
    let element = document.getElementById("countdown");
    element.innerHTML = countdown.toString();
}
function updateInfo(info) {
    let element = document.getElementById("info");
    element.innerHTML = info.toString();
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        updateCountdown("");
    });
}
function sortPlayersTable() {
    $("#players").trigger("updateCache");
    $("#players").trigger("appendCache");
    $("#players").trigger("update");
}
function loadPlayersData() {
    return __awaiter(this, void 0, void 0, function* () {
        let online_promise = new Promise(() => { });
        if (window.location.protocol === "https:") {
            online_promise = fetch("https://api.codetabs.com/v1/proxy/?quest=http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot");
        }
        else if (window.location.protocol === "http:") {
            online_promise = fetch("http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot");
        }
        else {
            console.error(`Unsupported protocol: ${window.location.protocol}`);
        }
        try {
            let online_response = yield online_promise;
            let json = yield online_response.json();
            players = [];
            json.OnlineUses.forEach((onlineUser) => {
                let player = new Player({
                    data: {
                        id: onlineUser.Id,
                        name: onlineUser.UserName,
                        ELO: onlineUser.ELO,
                    },
                });
                players.push(player);
            });
            for (let id = 0; id < players.length; id++) {
                players[id].fillOnlineInfo(json);
            }
            renderPlayersData(players);
        }
        catch (err) {
            console.error(err);
            updateCountdown(`Error: Failed to fetch live snapshot. ${err}`);
        }
    });
}
function renderPlayerData(player) {
    let table = document.getElementById("players");
    let tbody = table.tBodies[0];
    let playerRowId = [...tbody.rows].findIndex((row) => row.getAttribute("id") === `player-${player.id.toString()}`);
    let row = tbody.rows[playerRowId];
    $(document).on("click", `tr#player-${player.id.toString()} .matchupButton`, function () {
        $(`tr#player-${player.id.toString()}`).addClass("online");
    });
    row.cells[0].innerHTML = `<a title="ETT website" href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">🖥️</a><a title="statistics" href="https://beta.11-stats.com/stats/${player.id}/statistics" target="_blank">📈</a><a style="display:none" class="matchupButton" href="#">⚔️</a><span class="matchupResult">&nbsp;</span>`;
    row.cells[1].innerHTML = `<a href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.id}</a>`;
    row.cells[1].classList.add("id");
    row.cells[2].innerHTML = player.name === undefined ? "⌛" : `${player.name}`;
    row.cells[3].innerHTML =
        player.ELO === undefined
            ? "⌛"
            : `${player.ELO}${player.rank <= 1000 && player.rank > 0
                ? " (#" + player.rank.toString() + ")"
                : ""}`;
    let opponent_str = "";
    if (player.opponent !== undefined) {
        opponent_str = `<a href="https://www.elevenvr.net/eleven/${player.opponentid}" target='_blank'>${player.opponent}</a> <span class="${player.ranked ? "ranked" : "unranked"}">(${player.opponentELO})<span><a title="matchup" href="https://www.elevenvr.net/matchup/${player.id}/${player.opponentid}" target='_blank'>⚔️</a><a title="scoreboard" href="https://cristy94.github.io/eleven-vr-scoreboard/?user=${player.id}&rowsReversed=0&home-offset=0&away-offset=0" target='_blank'>🔍</a>`;
    }
    row.cells[4].innerHTML =
        player.opponent === undefined ? "" : `${opponent_str}`;
    function getTimeDifferenceString(current, previous) {
        var msPerMinute = 60 * 1000;
        var msPerHour = msPerMinute * 60;
        var msPerDay = msPerHour * 24;
        var msPerMonth = msPerDay * 30;
        var msPerYear = msPerDay * 365;
        var elapsed = current - previous;
        if (elapsed < msPerMinute) {
            return Math.round(elapsed / 1000) + " seconds ago";
        }
        else if (elapsed < msPerHour) {
            return Math.round(elapsed / msPerMinute) + " minutes ago";
        }
        else if (elapsed < msPerDay) {
            return Math.round(elapsed / msPerHour) + " hours ago";
        }
        else if (elapsed < msPerMonth) {
            return "approximately " + Math.round(elapsed / msPerDay) + " days ago";
        }
        else if (elapsed < msPerYear) {
            return ("approximately " + Math.round(elapsed / msPerMonth) + " months ago");
        }
        else {
            return "approximately " + Math.round(elapsed / msPerYear) + " years ago";
        }
    }
    var options = {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeZoneName: "short",
    };
    row.cells[5].innerHTML =
        player.online === undefined
            ? "⌛"
            : `${player.online === true
                ? player.device
                : "<span class='hidden'>" +
                    player.lastOnline +
                    "###</span><span title='" +
                    getTimeDifferenceString(Date.now(), player.lastOnline) +
                    "'>" +
                    new Date(player.lastOnline).toLocaleString(undefined, options) +
                    "</span>"}`;
    row.cells[5].setAttribute("data-timestamp", player.lastOnline.toString());
    row.cells[5].classList.add("last-online");
    row.cells[6].innerHTML =
        player.online === undefined
            ? "⌛"
            : `${player.online === true ? "✔️" : "❌"}`;
}
function renderPlayersData(players) {
    let shouldCreateRows = true;
    let table = document.getElementById("players");
    let tbody = table.tBodies[0];
    while (tbody.rows.length > 0) {
        tbody.deleteRow(0);
    }
    let row;
    if (shouldCreateRows) {
        for (let player of players) {
            row = tbody.insertRow(-1);
            for (let cellId = 0; cellId < cellsTemplate.length; cellId++) {
                row.insertCell();
                row.setAttribute("id", `player-${player.id.toString()}`);
            }
            row.cells[6].classList.add("hidden");
        }
    }
    for (let playerId = 0; playerId < players.length; playerId++) {
        let player = players[playerId];
        renderPlayerData(player);
    }
}
function preLoading() {
    updateCountdown(`Loading...`);
}
function postLoading() {
    updateCountdown(`Loaded.`);
    updateInfo(`Total Players: ${players.length}`);
    sortPlayersTable();
}
function loadAndRender() {
    return __awaiter(this, void 0, void 0, function* () {
        preLoading();
        let playersOld = [];
        for (let player of players) {
            playersOld.push(Object.assign({}, player));
        }
        yield loadPlayersData();
        postLoading();
    });
}
const refreshInterval = DEBUG ? 10 : 60 * 10;
let seconds = refreshInterval;
function countdownTimerCallback() {
    updateCountdown(`Updating in ${seconds} seconds`);
    if (seconds == 1) {
        seconds = refreshInterval;
    }
    else {
        seconds -= 1;
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        $.tablesorter.addParser({
            id: "rangesort",
            is: function (_) {
                return false;
            },
            format: function (s, _table) {
                return s.split("###")[0];
            },
            type: "numeric",
            parsed: false,
        });
        $("#players").tablesorter({
            sortInitialOrder: "desc",
            sortList: [
                [6, 0],
                [3, 1],
            ],
            headers: {
                0: { sorter: false, parser: false },
                1: { sorter: "digit", sortInitialOrder: "asc" },
                2: { sorter: "string", sortInitialOrder: "asc" },
                3: { sorter: "string", sortInitialOrder: "desc" },
                4: { sorter: false, parser: false },
                5: { sorter: "string", sortInitialOrder: "desc" },
            },
        });
        yield loadAndRender();
        setInterval(loadAndRender, refreshInterval * 1000);
        setInterval(countdownTimerCallback, 1000);
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield init();
    yield main();
}))();
//# sourceMappingURL=index.js.map