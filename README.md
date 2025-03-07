# Quantum checkers

This repository is created for the master thesis by Luuk van den Nouweland, university of Leiden. This is the final version of the code. My thesis can be found in Master_Thesis.pdf.

There are three versions of Quantumness that can be ussed:
- Classical: Normal Checkers
- QUANTUM_V1: Checkers with only superpositions. This means that checkerpieces are able to exist in superpositions and are measured when they are capturing/being captured
- QUANTUM_V2: Checkers with entanglement and superpositions. This means that if a piece tries to capture a piece in superposition, they become entangled.

In the main file most parameters can be changed.
If you set white_mcts or black_mcts to true respectively the white or black player uses MCTS to decide its moves. args1 and args2 are respectively related to white or black. These can be set to args_high or args_low. The difference is that args_low builds smaller trees in MCTS and is therefore faster.

For more information, see Master_Thesis.pdf

## Installing

You'll need Python 3. Check that you have at least version 3.12 with

```
python --version
```

Then create a virtual environment for the dependencies.

```
python -m venv ./qcheckersenv
```

Activate it now (and everytime you want to do something with this project in the shell).

```
source qcheckersenv/bin/activate
```

You will need to install the [unitary library](https://github.com/quantumlib/unitary/) from source. It is important to use v0.1, later version may not be compatible.

```
git clone https://github.com/quantumlib/unitary.git
cd unitary/
git checkout v0.1
pip install .
cd ..
```

And install the other requirements:

```
pip install -r requirements.txt
```

Now you are ready to run Quantum Checkers. Run it with `python main.py` or see all options with `python main.py --help`.


## Experiments

For our paper, we have run a number of experiments. To run many random
vs random games and report the average moves and times per rule set
and game type, use the following command. You can change the amount of
iterations, the file name and many other options.

```
python main.py --do-average-moves-and-time-experiment --iterations 500 --results-file average_moves_and_times_with_draw_experiment_result.txt
```
