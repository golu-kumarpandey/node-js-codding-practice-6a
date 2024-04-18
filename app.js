const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    console.log("server connected successfully");
    app.listen(3000, () => {
      console.log("server listen at http://local:3000/");
    });
  } catch (error) {
    console.log(`Db error ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

// API 1 : Get Details by State
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state 
    ORDER BY state_id
  `;

  const getStateResult = await db.all(getStatesQuery);

  response.send(
    getStateResult.map((e) => {
      return {
        stateId: e.state_id,
        stateName: e.state_name,
        population: e.population,
      };
    })
  );
});

// API 2: Get Details by StateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQueries = `
    SELECT *
    FROM state
    Where
    state_id = ${stateId}
    `;
  const getStateIdQueriesResult = await db.get(getStateIdQueries);
  response.send({
    stateId: getStateIdQueriesResult.state_id,
    stateName: getStateIdQueriesResult.state_name,
    population: getStateIdQueriesResult.population,
  });
});

// API 3: Add Details to District

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuires = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES (?,?,?,?,?,?)
  `;

  const districtQuiresResult = await db.run(addDistrictQuires, [
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  ]);
  response.send("District Successfully Added");
});

//API 4 : Get Details by district id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuires = `
  SELECT * FROM district 
  WHERE
   district_id = ${districtId}
  `;
  const districtIdResult = await db.get(getDistrictIdQuires);
  console.log(districtIdResult);
  response.send({
    districtId: districtIdResult.district_id,
    districtName: districtIdResult.district_name,
    stateId: districtIdResult.state_id,
    cases: districtIdResult.cases,
    cured: districtIdResult.cured,
    active: districtIdResult.active,
    deaths: districtIdResult.deaths,
  });
});

// API 5 : Delete Details by district Id

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtIdQueries = `
    DELETE FROM district WHERE district_id = ${districtId}
    `;
  const districtIdQueriesResult = await db.run(districtIdQueries);
  response.send("District Removed");
});

// API 6 : Update Details By District Id
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE district 
        SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE 
        district_id = ${districtId}
  `;
  const districtUpdateResult = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7 : Get Details By StateId

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateIdQuery = ` 
    SELECT cases, cured, active, deaths 
    FROM district 
    WHERE state_id = ${stateId}
  `;
  const updateStateIdQueries = await db.all(stateIdQuery);

  const getFinalResult = (arr) => {
    let total = {
      totalCases: 0,
      totalCured: 0,
      totalActive: 0,
      totalDeaths: 0,
    };

    arr.forEach((e) => {
      total.totalCases += e.cases;
      total.totalActive += e.active;
      total.totalCured += e.cured;
      total.totalDeaths += e.deaths;
    });

    return total;
  };

  response.send(getFinalResult(updateStateIdQueries));
});

// API 8 : Get Details by District Id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const districtIdQueries = ` 
        SELECT state_name FROM state
        WHERE state_id = (
            SELECT state_id 
            from 
            district 
            where 
            district_id = ${districtId}
        )
  `;
  const updateDistrictIdQueries = await db.get(districtIdQueries);
  response.send({
    stateName: updateDistrictIdQueries.state_name,
  });
});

module.exports = app;
