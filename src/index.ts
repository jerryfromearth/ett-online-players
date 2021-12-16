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
  id: number;
  name: string;
  ELO: number;
  rank: number;
  online?: boolean;
  lastOnline: number;
  device?: string;
  ranked?: boolean;
  opponent?: string;
  opponentid?: number;
  opponentELO?: number;

  constructor(json: any) {
    let data = json.data;

    this.id = parseInt(data.id);
    this.name = data?.attributes?.["user-name"];
    this.ELO = data?.attributes?.elo;
    this.rank = data?.attributes?.rank;
    this.lastOnline = 0;
  }

  fillName(json: any) {
    let data = json.data;

    this.id = parseInt(data.id);
    this.name = data?.attributes?.["user-name"];
    this.ELO = data?.attributes?.elo;
    this.rank = data?.attributes?.rank;
    this.lastOnline = Date.parse(data?.attributes?.["last-online"]);
  }

  fillOnlineInfo(json: any) {
    let users = json.OnlineUses.filter(
      (onlinePlayer: any) => onlinePlayer.Id === this.id.toString()
    );
    if (users.length > 0) {
      this.online = true;
      this.device = users[0].Device;
      this.name = users[0].UserName;
      this.ELO = Math.floor(users[0].ELO);
    } else {
      this.online = false;
      this.device = undefined;
    }

    // Find out opponent
    let rooms = json.Rooms.filter((room: any) => {
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
      room.Players.forEach((roomplayer: any) => {
        if (roomplayer.Id !== this.id.toString()) {
          this.opponent = roomplayer.UserName;
          this.opponentELO = roomplayer.ELO;
          this.opponentid = roomplayer.Id;
        }
      });
      this.ranked = room?.Match?.Ranked;
    } else {
      this.opponent = undefined;
      this.opponentELO = undefined;
      this.opponentid = undefined;
      this.ranked = undefined;
    }
  }
}

let players: Player[] = [];

function updateCountdown(countdown: string) {
  let element = document.getElementById(
    "countdown"
  )! as unknown as HTMLDivElement;
  element.innerHTML = countdown.toString();
}
function updateInfo(info: string) {
  let element = document.getElementById("info")! as unknown as HTMLDivElement;
  element.innerHTML = info.toString();
}

async function init() {
  updateCountdown("");
}

function sortPlayersTable() {
  // Sort table
  $("#players").trigger("updateCache");
  $("#players").trigger("appendCache");
  $("#players").trigger("update");
}

async function loadPlayersData() {
  // Fetch online status snapshot
  let online_promise: Promise<Response> = new Promise<Response>(() => {});
  if (window.location.protocol === "https:") {
    // https://www.whateverorigin.org/get?url=http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot
    // https://api.codetabs.com/v1/proxy/?quest=http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot
    online_promise = fetch(
      "https://api.codetabs.com/v1/proxy/?quest=http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot"
    );
  } else if (window.location.protocol === "http:") {
    online_promise = fetch(
      "http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot"
    );
  } else {
    console.error(`Unsupported protocol: ${window.location.protocol}`);
  }

  // Fill in online status
  try {
    let online_response = await online_promise;
    let json = await online_response.json();

    players = [];
    json.OnlineUses.forEach((onlineUser: any) => {
      let player = new Player({
        data: {
          id: onlineUser.Id,
          name: onlineUser.UserName,
          ELO: onlineUser.ELO,
        },
      });
      players.push(player);
    });
    //players.splice(1);

    for (let id = 0; id < players.length; id++) {
      players[id].fillOnlineInfo(json);
    }

    renderPlayersData(players);
  } catch (err) {
    console.error(err);
    updateCountdown(`Error: Failed to fetch live snapshot. ${err}`);
  }
}

function renderPlayerData(player: Player) {
  let table = document.getElementById("players") as unknown as HTMLTableElement;
  let tbody = table.tBodies[0];

  // Find out the row id of player in the table
  let playerRowId = [...tbody.rows].findIndex(
    (row) => row.getAttribute("id") === `player-${player.id.toString()}`
  );

  let row = tbody.rows[playerRowId];

  // TODO: not finished yet
  $(document).on(
    "click",
    `tr#player-${player.id.toString()} .matchupButton`,
    function () {
      $(`tr#player-${player.id.toString()}`).addClass("online");
    }
  );

  row.cells[0].innerHTML = `<a title="statistics" href="https://beta.11-stats.com/stats/${player.id}/statistics" target="_blank">📈</a><a style="display:none" class="matchupButton" href="#">⚔️</a><span class="matchupResult">&nbsp;</span>`;
  row.cells[1].innerHTML = `<a href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.id}</a>`;
  row.cells[1].classList.add("id");
  row.cells[2].innerHTML =
    player.name === undefined
      ? "⌛"
      : `<a title="ETT website" href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.name}</a>`;
  row.cells[3].innerHTML =
    player.ELO === undefined
      ? "⌛"
      : `${player.ELO}${
          player.rank <= 1000 && player.rank > 0
            ? " (#" + player.rank.toString() + ")"
            : ""
        }`;

  let opponent_str = "";
  if (player.opponent !== undefined) {
    opponent_str = `<a href="https://www.elevenvr.net/eleven/${
      player.opponentid
    }" target='_blank'>${player.opponent}</a> <span class="${
      player.ranked ? "ranked" : "unranked"
    }">(${
      player.opponentELO
    })<span><a title="matchup" href="https://www.elevenvr.net/matchup/${
      player.id
    }/${player.opponentid}" target='_blank'>⚔️</a>`;
  }
  opponent_str += `<a title="scoreboard" class="scoreboard" href="https://cristy94.github.io/eleven-vr-scoreboard/?user=${player.id}&rowsReversed=0&home-offset=0&away-offset=0" target='_blank'>🔍</a>`;

  row.cells[4].innerHTML = opponent_str;

  function getTimeDifferenceString(current: number, previous: number) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
      return Math.round(elapsed / 1000) + " seconds ago";
    } else if (elapsed < msPerHour) {
      return Math.round(elapsed / msPerMinute) + " minutes ago";
    } else if (elapsed < msPerDay) {
      return Math.round(elapsed / msPerHour) + " hours ago";
    } else if (elapsed < msPerMonth) {
      return "approximately " + Math.round(elapsed / msPerDay) + " days ago";
    } else if (elapsed < msPerYear) {
      return (
        "approximately " + Math.round(elapsed / msPerMonth) + " months ago"
      );
    } else {
      return "approximately " + Math.round(elapsed / msPerYear) + " years ago";
    }
  }

  var options: Intl.DateTimeFormatOptions = {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeZoneName: "short",
  };

  row.cells[5].innerHTML =
    player.online === undefined
      ? "⌛"
      : `${
          player.online === true
            ? player.device
            : "<span class='hidden'>" +
              player.lastOnline +
              "###</span><span title='" +
              getTimeDifferenceString(Date.now(), player.lastOnline) +
              "'>" +
              new Date(player.lastOnline).toLocaleString(undefined, options) +
              "</span>"
        }`;

  row.cells[5].setAttribute("data-timestamp", player.lastOnline.toString());
  row.cells[5].classList.add("last-online");

  row.cells[6].innerHTML =
    player.online === undefined
      ? "⌛"
      : `${player.online === true ? "✔️" : "❌"}`;
}

function renderPlayersData(players: Player[]) {
  let shouldCreateRows = true;
  let table = document.getElementById("players") as unknown as HTMLTableElement;
  let tbody = table.tBodies[0];

  while (tbody.rows.length > 0) {
    tbody.deleteRow(0);
  }

  let row: HTMLTableRowElement;
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

async function loadAndRender() {
  preLoading();

  let playersOld: Player[] = [];
  for (let player of players) {
    playersOld.push(Object.assign({}, player));
  }
  await loadPlayersData();
  postLoading();
}

const refreshInterval = DEBUG ? 10 : 60 * 10; // seconds
let seconds = refreshInterval;

function countdownTimerCallback() {
  updateCountdown(`Updating in ${seconds} seconds`);
  if (seconds == 1) {
    seconds = refreshInterval;
  } else {
    seconds -= 1;
  }
}

async function main() {
  $.tablesorter.addParser({
    // set a unique id
    id: "rangesort",
    is: function (_) {
      // return false so this parser is not auto detected
      return false;
    },

    // TODO:
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/tablesorter/Parsing/Parser.d.ts#L45 should be fixed:
    // format(text: string, table: TElement, cell: TElement, cellIndex: number): string;
    format: function (s, _table) {
      // After the TODO above is fixed, we can use this line:
      // return $(cell).attr("data-timestamp");
      return s.split("###")[0];
    },
    // set type, either numeric or text
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

  await loadAndRender();

  setInterval(loadAndRender, refreshInterval * 1000);

  setInterval(countdownTimerCallback, 1000);
}
(async () => {
  await init();
  await main();
})();
