# Quantum checkers

This repository implements quantum checkers.

There are three versions of Quantumness that can be used:
- Classical: Normal Checkers
- QUANTUM_V1: Checkers with only superpositions. This means that checkerpieces are able to exist in superpositions and are measured when they are capturing/being captured
- QUANTUM_V2: Checkers with entanglement and superpositions. This means that if a piece tries to capture a piece in superposition, they become entangled.
- QUANTUM_V3: Checkers with entanglement, superpositions and interference. This means that if a piece tries to capture a piece in superposition, they become entangled.

There are two parts. There is a visual version with support for everything except QUANTUM_V3, where you can play quantum checkers in a pygame interface. You can run this with `python main.py`. The precise rules and settings can be chosen with command line argument. Use 'python main.py --help' for a full list of the possible arguments.

The other version is run with `python qcheckers_with_interference.py`. This version supports all variants of quantum checkers, but currently only supports a command line interface.

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

