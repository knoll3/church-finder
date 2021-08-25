const gpsCoordinates = require("./gps.json");
const fetch = require("node-fetch");
const parseString = require("xml2js").parseString;
const moment = require("moment");
const fs = require("fs");

const RADIUS = 50;
const PERIOD = 1000; // ms
const START_INDEX = 2000;
const SAVE_DATA_PATH = "./save-data";
const SAVE_PERIOD = 10;

const headers = {
    Connection: "keep-alive",
    "sec-ch-ua": '"Chromium";v="91", " Not;A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    Accept: "*/*",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    Referer:
        "https://www.bible.ca/directory/seek-by-gps.php?latitude=44.91814&longitude=-114.80713&distance=-1&zoom=6&type=church&req_man=1&myp=ID",
    "Accept-Language": "en-US,en;q=0.9",
    Cookie: "PHPSESSID=fsg580j6ku5n0pksml09sovp6c",
};

const fileName = `${SAVE_DATA_PATH}/save-data-${Date.now()}.json`;
let saveData = [];

function initSaveFile() {
    fs.appendFileSync(fileName, "[]");
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMs(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function findChurches(coord, radius) {
    const baseUrl = "https://www.bible.ca/directory/seek-xml-by-gps.php";
    const queryParams = `?distance=${radius}&latitude=${coord[1]}&longitude=${coord[0]}&type=church`;

    return new Promise((resolve, reject) => {
        fetch(`${baseUrl}${queryParams}`, {
            headers: headers,
        }).then((response) => {
            response.text().then((xml) => {
                const result = parseString(xml, (err, result) => {
                    if (err) reject(err);
                    if (result.markers.length === 0) {
                        resolve([]);
                        return;
                    }
                    const markers = result.markers.marker.map((x) => x["$"]);
                    resolve(markers);
                });
            });
        });
    });
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

(async () => {
    console.log(`Checking for results within a radius of ${RADIUS} mi`);
    console.log(`Running every ${PERIOD / 1000} sec`);
    console.log(`Saving every ${SAVE_PERIOD} queries to ${fileName}`);
    console.log("Starting query. This will take a while...");

    initSaveFile();
    const timeStarted = Date.now();
    let execCount = 0;
    for (let i = START_INDEX; i < gpsCoordinates.length; i++) {
        const coord = gpsCoordinates[i];
        const results = await findChurches(coord, RADIUS);

        saveData = saveData.concat(results).filter(onlyUnique);

        // Save every so often
        if (i % SAVE_PERIOD === 0) {
            fs.writeFileSync(fileName, JSON.stringify(saveData));
        }

        console.log(
            `(${i + 1}/${gpsCoordinates.length}): Found ${
                results.length
            } results for GPS coordinates ${JSON.stringify(
                coord
            )}. Current length: ${saveData.length}. Time running: ${parseMs(
                Date.now() - timeStarted
            )}.`
        );

        await sleep(PERIOD);
        execCount = i + 1;
    }
    console.log("DONE!");
    console.log(`Executed ${execCount} queries`);
    console.log(`Saved ${saveData.length} entries`);
    console.log(`Radius: ${RADIUS}`);
})();
