var request = require("supertest");
var sandbox = require("sinon").createSandbox();
const app = require("../index");

request = request(app);

async function createLeagueAddUser(){

}
describe('Testing /notifications', () => {
    let cookie = "";

    before(async ()=> {
        // Login to the program
        const auth = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImM5YWZkYTM2ODJlYmYwOWViMzA1NWMxYzRiZDM5Yjc1MWZiZjgxOTUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODMzMjMwNTksImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwMTk3NzE1OTgxODk1NTI5NTk2NiIsImhkIjoidWNkYXZpcy5lZHUiLCJlbWFpbCI6InNpcndhbmdAdWNkYXZpcy5lZHUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6IkpoYW8gSHVhIFdhbmciLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUdObXl4WmJvem9ncV8yaEdtSEI0Qmdxdi04THdhRDc3VTZXT2lyc3JyVjY9czk2LWMiLCJnaXZlbl9uYW1lIjoiSmhhbyBIdWEiLCJmYW1pbHlfbmFtZSI6IldhbmciLCJpYXQiOjE2ODMzMjMzNTksImV4cCI6MTY4MzMyNjk1OSwianRpIjoiODRhODRjZTI5NTgwZmRiZDkzZDVjMjYwNGNjZDBkYTUyNDRjYjZiNCJ9.dh-4l-J6WMXUeVwkgYvwF1iYPKL6JBKIanX_7Zj5KlHaWudL9L2egqitc9wxBop-QF6H6jRficSdN5vcZORR2-Txj-VolDa5JkeuGTxuqgdzA6A6WrEx9vfX6dtM4OrsvwwfiTjZIiMipEDSBmW4v-LUZSP9A6GzjTYFREYk4NJwuLpgp5bCoRnE7TlUIDHzs0ZcI4W4EBSSQQ9HZxdMcbEU6tgBHh433C_SZhTtNRxNMNcUVQkV1XrIafQr4-ERmnzNaDbyy0Zy23ucpmEGExY9LN55xkBbfU6T4XBXh_ASa3rpHv7_yi0SobShIre8w-2ejPxwMWm2OrvLMw3tMg"
        await request.post("/auth/login/google")
        .set('Authorization', auth)
        .set('Accept', 'application/json')
        .then(res => {
            cookie = res.headers['set-cookie'];
        })
    });

    describe('Testing user gets notifications when event occurs', () => {

        afterEach(() => {
            sandbox.restore();
        });

        it('POST get in progress should return 5 medals for newUser', async () => {
            // Set up the test: 
                // Create a league
            await request.post("").set('Authorization', auth)
        .set('Accept', 'application/json')
        .then(res => {
            cookie = res.headers['set-cookie'];
        })
                // Add the user as a member
                // Add the user as an admin

            // Now, the user should have a notification that they are an admin
            // get notifications

            // Now check the notification

            // delete the notification
            // clean up the league info
        })



    });
  });