const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DBError: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertScoreObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => {
      convertPlayerObjectToResponseObject(eachPlayer);
    })
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT *
    FROM player_details
    WHERE player_id=${playerId};
    `;
  const playerDetails = await db.get(getPlayersQuery);
  response.send(convertPlayerObjectToResponseObject(playerDetails));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
  player_details
  SET
  player_name=${playerName}
  WHERE player_id=${playerId};
  `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id=${matchId};
    `;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchObjectToResponseObject(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
  SELECT *
  FROM match_details
  WHERE player_id=${playerId};
  `;
  const matches = await db.all(getMatchesQuery);
  response.send(convertMatchObjectToResponseObject(matches));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `
   SELECT 
   player_id,
   player_name
   FROM
   player_details JOIN player_match_score
   ON player_details.player_id=player_match_score.player_id
   WHERE player_match_score.match_id=${matchId};
  `;
  const matches = await db.all(getMatchesQuery);
  response.send(
    matches.map((match) => {
      convertPlayerObjectToResponseObject(match);
    })
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
    SELECT
    player_id,
    player_name,
    SUM(score) AS total_score,
    SUM(fours) AS fours,
    SUM(sixes) AS sixes
    FROM 
    player_details JOIN player_match_score
   ON player_details.player_id=player_match_score.player_id
   WHERE player_match_score.player_id=${playerId};
    `;
  const matchStats = await db.get(getStatsQuery);
  response.send({
    playerId: matchStats.playerId,
    playerName: matchStats.player_name,
    totalScore: matchStats.total_score,
    totalFours: matchStats.fours,
    totalSixes: matchStats.sixes,
  });
});
