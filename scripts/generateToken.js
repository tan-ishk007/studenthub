import "dotenv/config";
import { google } from "googleapis";
import readline from "readline";

// These used to be hardcoded here. If this file was ever committed with
// real values filled in, treat that Client Secret as compromised and
// rotate it in Google Cloud Console (APIs & Services -> Credentials) —
// anyone with the repo's history could use it.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env (see .env.example).");
  process.exit(1);
}

const REDIRECT_URI = "http://localhost";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/drive.readonly",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: scopes,
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nPaste the authorization code here:\n", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("\nYour token.json:\n");
    console.log(JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
    }, null, 2));
  } catch (err) {
    console.error(err);
  }

  rl.close();
});
