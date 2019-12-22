import { readFileSync } from "fs";
import Tunisia from "../src/index";

process.env.DEBUG = "tunisia:*";

const config = JSON.parse(readFileSync("credentials.json", "utf-8"));
export const tunisia = new Tunisia(config);
