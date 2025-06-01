# Cheqqers

This repository implements quantum checkers.

There are three versions of Quantumness that can be used:
- Classical: Normal Checkers
- SUPERPOSITION: Checkers with only superpositions. This means that checkerpieces are able to exist in superpositions and are measured when they are capturing/being captured
- ENTANGLEMENT: Checkers with entanglement and superpositions. This means that if a piece tries to capture a piece in superposition, they become entangled.
- INTERFERENCE: Checkers with entanglement, superpositions and interference. This means that if a piece tries to capture a piece in superposition, they become entangled.


## Docker
This project lets you play Cheqqers in a Docker container — no need to install Python or dependencies locally.

### Prerequisites

- Install [Docker](https://www.docker.com/products/docker-desktop/) on your computer.
- Clone this repository:

### Building the docker image
Navigate to the root directory of this repository and run the following command to build the docker image.
```
docker build -t cheqqers .
```
- `-t cheqqers` tags the image with the name cheqqers for easy reference.
- `.` tells Docker to use the current directory where the Dockerfile lives.

### Run the game interactively
Start the game container and interact with it in your terminal:
```
docker run -it --rm cheqqers
```
- `-it` connects your terminal input/output to the container so you can play.
- `--rm` removes the container once you exit to keep things clean.
- `cheqqers` is the image name from the build step.


## Installing without docker

You'll need Python 3. Check that you have at least version 3.12 with

```
python --version
```

Then create a virtual environment for the dependencies.

```
python -m venv ./cheqqersenv
```

Activate it now (and everytime you want to do something with this project in the shell).

```
source cheqqersenv/bin/activate
```

And install the requirements:

```
pip install -r requirements.txt
```

Now you can play the game in the terminal from main.py.

```
python main.py
```

If you want to play against another player, or a different bot, you can easily change the players in `main.py`.

## Web app

You can play Cheqqers in a GUI using the web app. To do that you need to run the front end and the backend.

The backend can be started with:

```
python -m fastapi dev api.py
```

For the frontend, you will need NPM (at least version 10). Then install the dependencies:

```
npm install
```

The frontend can be started with:

```
npm run dev
```

## License

Cheqqers is free and open source software. You can use it under the
conditions of the GNU Affero General Public License version 3, or (at
your option) any later version. A copy of the license is included in
the `COPYING` file.

The icons used for the frontend in `frontend/src/public` are available
under the <a
href="https://creativecommons.org/publicdomain/zero/1.0/">CC0
1.0</a><img
src="https://mirrors.creativecommons.org/presskit/icons/cc.svg"
style="max-width: 1em;max-height:1em;margin-left: .2em;"><img
src="https://mirrors.creativecommons.org/presskit/icons/zero.svg"
style="max-width: 1em;max-height:1em;margin-left: .2em;"> license.


