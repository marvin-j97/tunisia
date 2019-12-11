import { readFileSync } from "fs";
import Tunisia from "../src/index";

const config = JSON.parse(readFileSync("credentials.json", "utf-8"));
export const tunisia = new Tunisia(config);
