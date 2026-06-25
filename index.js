import "dotenv/config";
import express from "express";
import Redis from "ioredis";

const redis = new Redis();

const app = express();
const port = 3000;
const map1 = new Map();
const apiKey = process.env.API_KEY;

map1.set("recife", "sunny");
map1.set("sao Paulo", "cloudy");
map1.set("londres", "rainy");

async function getWeatherfromAPI(location) {
  let url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/?key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar os dados do clima:", error);
  }
}

async function getWeather(location) {
  const cacheKey = `weather:${location}`;

  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    console.log("Servindo do Cache!");
    return JSON.parse(cachedData);
  }
  console.log("Buscando da API...");
  const apiData = await getWeatherfromAPI(location);

  await redis.set(cacheKey, JSON.stringify(apiData), "EX", 3600);

  return apiData;
}

app.get("/", (req, res) => {
  res.json({ message: "chegou" });
});

app.get("/api/v1/weather/:city", async (req, res) => {
  const location = req.params.city.toLowerCase();
  /*if (map1.get(city) === undefined) {
    res.status(404).send("Cidade inexistente");
  } else {
    res.json({ city: city, weather: map1[city] });
  }
    */
  const weatherData = await getWeather(location);
  res.json(weatherData);
});

app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
});
