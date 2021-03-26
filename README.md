# Tic Tac Toe Challenge

This repository starts a tic-tac-toe matchmaking server and dashboard, which you can connect to using the template client in the client-template folder.

The goal is to allow students to compete with each other in writing a tic-tac-toe AI, and ranking the various clients against eachother using the ELO ranking algorithm (best known for its usage in chess)

# Setup
1. Clone the repository
2. Run `yarn install --frozen-lockfile`
3. Run the command `node server.js` to start the server
4. Open the dashboard on `http://localhost:1337`

The clients can be started from the `client-template` subfolder, by running `node client.js [your-client-name]` in that folder. This folder ALSO needs a `yarn install --frozen-lockfile` command. 

If two clients with the same name are connected, the last on to connect will be the only one to be entered in the lobby. The server will not start games if there is only one client in the lobby.

# License & Usage
This project is licensed as GPL v3.0, which means you can use it [as you please](https://choosealicense.com/licenses/gpl-3.0/) [(details)](https://choosealicense.com/licenses/gpl-3.0/). If you make changes to anything in this repository, you MUST publish those changes again under the same license. It is not allowed to strip the license from this project and/or present it as your own.
