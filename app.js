require("./src/config");
const { asyncForEach } = require("./src/utils");
const mediumCard = require("./src/card");
const { getUserData } = require("./api/api");
var express = require("express");
var app = express();
app.use(express.json());

app.get("/latest", async (request, response) => {
  try {
    if (!request.query.username) {
      response.write(
        JSON.stringify({
          error: "username is required",
        })
      );
      response.end();
      return;
    }

    const username = request.query.username;
    console.log(request.query);
    const offset = request.query.offset || 0;
    const width = request.query.width || config.card.width;
    const height = request.query.height || config.card.height;
    const limit = request.query.limit == null ? 1 :
      request.query.limit <= 10
        ? request.query.limit
        : false || config.default.limit;

    request.query.width = width;
    request.query.height = height;

    var resultData = await getUserData(username);
    let result = `<svg>`;

    if (resultData.length < limit) limit = resultData.length;

    result = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
              width="${
                (limit == 1 ? width : 2 * width) +
                config.default.margin_left +
                config.card.spacing
              }" 
              version="1.2" 
              height="${
                Math.round(limit / 2) * height +
                config.default.margin_top * 2 +
                config.card.spacing * Math.floor(limit / 2)
              }"
              viewBox="0 0 ${
                (limit == 1 ? width : 2 * width) +
                config.default.margin_left +
                config.card.spacing
              } ${
      Math.round(limit / 2) * height +
      config.default.margin_top * 2 +
      config.card.spacing * Math.floor(limit / 2)
    }">`;
    resultData = resultData.slice(offset, offset + limit);
    await asyncForEach(
      resultData,
      request.query,
      async (blog, index, settings) => {
        if (index >= limit) {
          return;
        }
        const mediumCardObj = await mediumCard(blog, settings, index);
        result += `<g requiredFeatures="http://www.w3.org/Graphics/SVG/feature/1.2/#TextFlow" transform="translate(${
          (index % 2 ? width + config.card.spacing : 0) +
          config.default.margin_left
        }, ${
          Math.floor(index / 2) * height +
          config.default.margin_top +
          (index > 1 ? config.card.spacing * Math.floor(index / 2) : 0)
        })">${mediumCardObj}</g>`;
      }
    );

    result += `</svg>`;

    response.setHeader(
      "Cache-Control",
      "public, no-cache, no-store, must-revalidate"
    );
    response.setHeader("Expires", "-1");
    response.setHeader("Pragma", "no-cache");
    response.writeHead(200, { "Content-Type": "image/svg+xml" });

    response.write(result);
    response.end();
  } catch (error) {
    console.log(error);
    response.send("Error while fetching the data" + error);
  }
});

var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Server listening " + port);
});
